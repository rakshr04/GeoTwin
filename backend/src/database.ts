import 'dotenv/config';

import {
  ForbiddenException,
  Global,
  Injectable,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import {
  DataSource,
  DataSourceOptions,
  Repository,
} from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import {
  CaseAssignment,
  ENTITIES,
  RestorationCase,
} from './entities';
import {
  AuthenticatedUser,
  OfficerRole,
} from './common';

function createDatabaseOptions(
  environment: Record<string, string | undefined>,
): DataSourceOptions {
  const databaseUrl = environment.DATABASE_URL?.trim();
  const sslEnabled =
    environment.DATABASE_SSL?.toLowerCase() === 'true';

  const sharedOptions = {
    type: 'postgres' as const,
    entities: ENTITIES,
    migrations: [
      __dirname + '/database/migrations/*{.ts,.js}',
    ],
    synchronize: false,
    namingStrategy: new SnakeNamingStrategy(),
    ssl: sslEnabled
      ? {
          rejectUnauthorized: false,
        }
      : false,
  };

  if (databaseUrl) {
    return {
      ...sharedOptions,
      url: databaseUrl,
    };
  }

  return {
    ...sharedOptions,
    host: environment.DATABASE_HOST ?? '127.0.0.1',
    port: Number(environment.DATABASE_PORT ?? 5433),
    database: environment.DATABASE_NAME ?? 'geotwin',
    username: environment.DATABASE_USER ?? 'geotwin',
    password:
      environment.DATABASE_PASSWORD ?? 'geotwin_local',
  };
}

export const AppDataSource = new DataSource(
  createDatabaseOptions(process.env),
);

@Injectable()
export class ScopePolicy {
  constructor(
    @InjectRepository(RestorationCase)
    private readonly cases: Repository<RestorationCase>,
    @InjectRepository(CaseAssignment)
    private readonly assignments: Repository<CaseAssignment>,
  ) {}

  async assertCase(
    user: AuthenticatedUser,
    caseId: string,
  ): Promise<void> {
    if (
      [
        OfficerRole.SYSTEM_ADMINISTRATOR,
        OfficerRole.STATE_PROGRAMME_OFFICER,
      ].includes(user.role)
    ) {
      return;
    }

    const restorationCase = await this.cases.findOne({
      where: {
        id: caseId,
      },
    });

    if (!restorationCase) {
      throw new ForbiddenException('Case unavailable.');
    }

    if (
      user.role ===
        OfficerRole.DISTRICT_RESTORATION_OFFICER &&
      restorationCase.districtOfficerId ===
        user.officerProfileId
    ) {
      return;
    }

    const assigned = await this.assignments.exist({
      where: {
        caseId,
        officerProfileId: user.officerProfileId,
        active: true,
      },
    });

    if (assigned) {
      return;
    }

    throw new ForbiddenException(
      'Case is outside your assigned scope.',
    );
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService,
      ): DataSourceOptions =>
        createDatabaseOptions({
          DATABASE_URL:
            config.get<string>('DATABASE_URL'),
          DATABASE_SSL:
            config.get<string>('DATABASE_SSL'),
          DATABASE_HOST:
            config.get<string>('DATABASE_HOST'),
          DATABASE_PORT:
            config.get<string>('DATABASE_PORT'),
          DATABASE_NAME:
            config.get<string>('DATABASE_NAME'),
          DATABASE_USER:
            config.get<string>('DATABASE_USER'),
          DATABASE_PASSWORD:
            config.get<string>('DATABASE_PASSWORD'),
        }),
    }),
    TypeOrmModule.forFeature([
      RestorationCase,
      CaseAssignment,
    ]),
  ],
  providers: [ScopePolicy],
  exports: [ScopePolicy, TypeOrmModule],
})
export class DatabaseModule {}
