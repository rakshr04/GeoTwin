import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
describe('GeoTwin app',()=>{let app:NestFastifyApplication;beforeAll(async()=>{const m=await Test.createTestingModule({imports:[AppModule]}).compile();app=m.createNestApplication(new FastifyAdapter());app.setGlobalPrefix('api/v1');await app.init();await app.getHttpAdapter().getInstance().ready();});afterAll(()=>app.close());it('boots',()=>expect(app).toBeDefined());});
