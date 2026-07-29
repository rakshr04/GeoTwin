import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './common';
import { DatabaseModule } from './database';
import { AuthModule, SupabaseAuthGuard } from './auth';
import { WorkflowModule } from './workflow';
import { DomainModule } from './domain';
import { AiModule } from './ai';
import { HealthModule } from './health';
import { FieldOperationsModule } from './modules/field-operations/field-operations.module';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),DatabaseModule,AuthModule,WorkflowModule,DomainModule,AiModule,HealthModule,FieldOperationsModule],providers:[{provide:APP_GUARD,useExisting:SupabaseAuthGuard},{provide:APP_GUARD,useClass:RolesGuard}]})export class AppModule{}
