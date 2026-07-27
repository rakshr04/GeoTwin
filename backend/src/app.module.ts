import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard, RolesGuard } from './common';
import { DatabaseModule } from './database';
import { AuthModule } from './auth';
import { WorkflowModule } from './workflow';
import { DomainModule } from './domain';
import { AiModule } from './ai';
import { HealthModule } from './health';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),DatabaseModule,AuthModule,WorkflowModule,DomainModule,AiModule,HealthModule],providers:[{provide:APP_GUARD,useClass:JwtAuthGuard},{provide:APP_GUARD,useClass:RolesGuard}]})export class AppModule{}
