import { Body, Controller, Get, Injectable, Module, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { CurrentUser, Public, AuthenticatedUser } from './common';
import { OfficerProfile, RefreshToken, User } from './entities';

@Injectable()
export class AuthService{
  constructor(@InjectRepository(User)private users:Repository<User>,@InjectRepository(OfficerProfile)private profiles:Repository<OfficerProfile>,@InjectRepository(RefreshToken)private tokens:Repository<RefreshToken>,private jwt:JwtService,private cfg:ConfigService){}
  private async payload(u:User){const p=await this.profiles.findOneByOrFail({userId:u.id});return{sub:u.id,officerProfileId:p.id,role:p.role,email:u.email,stateId:p.stateId,districtId:p.districtId};}
  async login(email:string,password:string){const u=await this.users.findOne({where:{email:email.toLowerCase()}});if(!u||!u.isActive||!await bcrypt.compare(password,u.passwordHash))throw new UnauthorizedException('Invalid credentials.');const p=await this.payload(u);const accessToken=await this.jwt.signAsync(p);const refreshToken=await this.jwt.signAsync({...p,type:'refresh'},{secret:this.cfg.getOrThrow('JWT_REFRESH_SECRET'),expiresIn:this.cfg.get('JWT_REFRESH_EXPIRES_IN','7d') as any});const decoded=this.jwt.decode(refreshToken) as{exp:number};await this.tokens.save(this.tokens.create({userId:u.id,tokenHash:await bcrypt.hash(refreshToken,10),expiresAt:new Date(decoded.exp*1000)}));return{accessToken,refreshToken,user:{id:u.id,email:u.email,profile:await this.profiles.findOneByOrFail({userId:u.id})}};}
  async refresh(refreshToken:string){let p:any;try{p=await this.jwt.verifyAsync(refreshToken,{secret:this.cfg.getOrThrow('JWT_REFRESH_SECRET')});}catch{throw new UnauthorizedException('Invalid refresh token.');}const active=await this.tokens.find({where:{userId:p.sub,revokedAt:IsNull()}});if(!await Promise.all(active.map(x=>bcrypt.compare(refreshToken,x.tokenHash))).then(x=>x.some(Boolean)))throw new UnauthorizedException('Invalid refresh token.');const u=await this.users.findOneByOrFail({id:p.sub});return{accessToken:await this.jwt.signAsync(await this.payload(u))};}
  async logout(refreshToken:string){for(const t of await this.tokens.find({where:{revokedAt:IsNull()}})){if(await bcrypt.compare(refreshToken,t.tokenHash)){t.revokedAt=new Date();await this.tokens.save(t);break;}}return{success:true};}
  async me(userId:string){const u=await this.users.findOneByOrFail({id:userId});return{id:u.id,email:u.email,isActive:u.isActive,profile:await this.profiles.findOneByOrFail({userId})};}
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){constructor(c:ConfigService){super({jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),secretOrKey:c.getOrThrow('JWT_ACCESS_SECRET')});}validate(p:any):AuthenticatedUser{return{userId:p.sub,officerProfileId:p.officerProfileId,role:p.role,email:p.email,stateId:p.stateId,districtId:p.districtId};}}
class LoginDto{@IsEmail()email:string;@IsString()@MinLength(8)password:string}class TokenDto{@IsString()refreshToken:string}
@Controller('auth')export class AuthController{constructor(private s:AuthService){}@Public()@Post('login')login(@Body()d:LoginDto){return this.s.login(d.email,d.password)}@Public()@Post('refresh')refresh(@Body()d:TokenDto){return this.s.refresh(d.refreshToken)}@Post('logout')logout(@Body()d:TokenDto){return this.s.logout(d.refreshToken)}@Get('me')me(@CurrentUser()u:AuthenticatedUser){return this.s.me(u.userId)}}
@Module({imports:[ConfigModule,PassportModule,TypeOrmModule.forFeature([User,OfficerProfile,RefreshToken]),JwtModule.registerAsync({inject:[ConfigService],useFactory:(c:ConfigService)=>({secret:c.getOrThrow('JWT_ACCESS_SECRET'),signOptions:{expiresIn:c.get('JWT_ACCESS_EXPIRES_IN','15m') as any}})})],providers:[AuthService,JwtStrategy],controllers:[AuthController]})export class AuthModule{}
