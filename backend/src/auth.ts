import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Module,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import {
  AuthenticatedUser,
  CurrentUser,
  IS_PUBLIC_KEY,
  Public,
} from './common';
import {
  OfficerProfile,
  RefreshToken,
  Region,
  User,
} from './entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(OfficerProfile)
    private readonly profiles: Repository<OfficerProfile>,
    @InjectRepository(RefreshToken)
    private readonly tokens: Repository<RefreshToken>,
    @InjectRepository(Region)
    private readonly regions: Repository<Region>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async payload(user: User): Promise<AuthenticatedUser> {
    const profile = await this.profiles.findOneByOrFail({
      userId: user.id,
    });
    return {
      userId: user.id,
      officerProfileId: profile.id,
      role: profile.role,
      email: user.email,
      stateId: profile.stateId,
      districtId: profile.districtId,
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase() },
    });
    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const payload = await this.payload(user);
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      },
    );
    const decoded = this.jwt.decode(refreshToken) as {
      exp: number;
    };
    await this.tokens.save(
      this.tokens.create({
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(decoded.exp * 1000),
      }),
    );
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        profile: await this.profiles.findOneByOrFail({
          userId: user.id,
        }),
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: AuthenticatedUser;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow(
          'JWT_REFRESH_SECRET',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const activeTokens = await this.tokens.find({
      where: {
        userId: payload.userId,
        revokedAt: IsNull(),
      },
    });
    const matches = await Promise.all(
      activeTokens.map((token) =>
        bcrypt.compare(refreshToken, token.tokenHash),
      ),
    );
    if (!matches.some(Boolean)) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const user = await this.users.findOneByOrFail({
      id: payload.userId,
    });
    return {
      accessToken: await this.jwt.signAsync(
        await this.payload(user),
      ),
    };
  }

  async logout(refreshToken: string) {
    const activeTokens = await this.tokens.find({
      where: { revokedAt: IsNull() },
    });
    for (const token of activeTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        token.revokedAt = new Date();
        await this.tokens.save(token);
        break;
      }
    }
    return { success: true };
  }

  async me(user: AuthenticatedUser) {
    const profile = await this.profiles.findOneByOrFail({
      id: user.officerProfileId,
    });
    const district = profile.districtId
      ? await this.regions.findOneBy({ id: profile.districtId })
      : null;
    return {
      id: profile.id,
      authUserId: profile.authUserId ?? user.userId,
      email: profile.email ?? user.email,
      displayName: profile.fullName,
      role: profile.role,
      active: profile.active,
      districtId: profile.districtId ?? null,
      districtName: district?.name ?? null,
    };
  }
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(OfficerProfile)
    private readonly profiles: Repository<OfficerProfile>,
  ) {
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    const key = (
      this.config.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.config.get<string>('SUPABASE_ANON_KEY')
    )?.trim();
    this.supabase =
      url && key
        ? createClient(url, key, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          })
        : null;
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();
    const authorization = request.headers.authorization;
    const token =
      authorization?.startsWith('Bearer ')
        ? authorization.slice(7).trim()
        : '';
    if (!token) {
      throw new UnauthorizedException(
        'Authentication required.',
      );
    }

    const supabaseUser = await this.verifySupabase(token);
    if (supabaseUser) {
      request.user = supabaseUser;
      return true;
    }

    const legacyUser = await this.verifyLegacy(token);
    if (legacyUser) {
      request.user = legacyUser;
      return true;
    }

    throw new UnauthorizedException(
      'Invalid or expired access token.',
    );
  }

  private async verifySupabase(
    token: string,
  ): Promise<AuthenticatedUser | null> {
    if (!this.supabase) {
      return null;
    }
    const { data, error } =
      await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    const profile = await this.profiles.findOne({
      where: {
        authUserId: data.user.id,
        active: true,
      },
    });
    if (!profile) {
      throw new UnauthorizedException(
        'No active GeoTwin officer profile is linked to this account.',
      );
    }
    return {
      userId: data.user.id,
      officerProfileId: profile.id,
      role: profile.role,
      email: profile.email ?? data.user.email ?? '',
      stateId: profile.stateId,
      districtId: profile.districtId,
    };
  }

  private async verifyLegacy(
    token: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      const payload =
        await this.jwt.verifyAsync<AuthenticatedUser>(token);
      const profile = await this.profiles.findOne({
        where: {
          id: payload.officerProfileId,
          active: true,
        },
      });
      return profile ? payload : null;
    } catch {
      return null;
    }
  }
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

class TokenDto {
  @IsString()
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: TokenDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: TokenDto) {
    return this.service.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.me(user);
  }
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      OfficerProfile,
      RefreshToken,
      Region,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as any,
        },
      }),
    }),
  ],
  providers: [AuthService, SupabaseAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, SupabaseAuthGuard, JwtModule],
})
export class AuthModule {}
