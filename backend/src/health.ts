import { Controller, Get, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Public } from './common';
@Controller('health')export class HealthController{constructor(private db:DataSource,private c:ConfigService){}@Public()@Get()async health(){let database='down';try{await this.db.query('SELECT 1');database='up'}catch{}return{status:database==='up'?'ok':'degraded',api:'up',database,agentic:this.c.get<boolean>('AGENTIC_ASSISTANT_ENABLED')?'enabled':'disabled',chat:this.c.get<boolean>('CHAT_ASSISTANT_ENABLED')?'enabled':'disabled',precomputedDemo:this.c.get<boolean>('PRECOMPUTED_DEMO_DATA_ENABLED')?'enabled':'disabled'}}@Public()@Get('live')live(){return{status:'ok'}}@Public()@Get('ready')async ready(){try{await this.db.query('SELECT 1');return{status:'ready'}}catch{return{status:'not-ready'}}}}
@Module({controllers:[HealthController]})export class HealthModule{}
