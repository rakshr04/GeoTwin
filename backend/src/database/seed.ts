import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../database';
import { LandPatch, OfficerProfile, PrioritySignal, Region, User } from '../../src/entities';
import { OfficerRole, SignalStatus } from '../../src/common';
import { createHash } from 'crypto';
async function seed(){
  await AppDataSource.initialize();
  const users=AppDataSource.getRepository(User),profiles=AppDataSource.getRepository(OfficerProfile),regions=AppDataSource.getRepository(Region);
  const state=await regions.save(regions.create({name:'Telangana',type:'STATE',code:'TG'}));
  const rr=await regions.save(regions.create({name:'Rangareddy',type:'DISTRICT',code:'RR',parentId:state.id}));
  await regions.save(regions.create({name:'Medak',type:'DISTRICT',code:'MDK',parentId:state.id}));
  await regions.save(regions.create({name:'Nalgonda',type:'DISTRICT',code:'NLG',parentId:state.id}));
  const mandal=await regions.save(regions.create({name:'Shankarpally',type:'MANDAL',parentId:rr.id}));
  const village=await regions.save(regions.create({name:'Mokila',type:'VILLAGE',parentId:mandal.id}));
  const passwordHash=await bcrypt.hash('GeoTwinDemo@2026',12);
  const accounts:[string,string,OfficerRole,string?,string?][]=[
    ['admin@geotwin.local','System Administrator',OfficerRole.SYSTEM_ADMINISTRATOR,state.id],
    ['state@geotwin.local','State Programme Officer',OfficerRole.STATE_PROGRAMME_OFFICER,state.id],
    ['district@geotwin.local','District Restoration Officer',OfficerRole.DISTRICT_RESTORATION_OFFICER,state.id,rr.id],
    ['technical@geotwin.local','Technical Restoration Officer',OfficerRole.TECHNICAL_RESTORATION_OFFICER,state.id,rr.id],
    ['field@geotwin.local','Field Verification Officer',OfficerRole.FIELD_VERIFICATION_OFFICER,state.id,rr.id],
  ];
  const created:Record<string,OfficerProfile>={};
  for(const [email,fullName,role,stateId,districtId] of accounts){const u=await users.save(users.create({email,passwordHash,isActive:true}));created[role]=await profiles.save(profiles.create({userId:u.id,fullName,role,stateId,districtId}));}
  await AppDataSource.getRepository(PrioritySignal).save(AppDataSource.getRepository(PrioritySignal).create({stateId:state.id,districtId:rr.id,priorityScore:86.5,scoreBreakdown:{erosion:30,vegetationLoss:22,waterStress:20,communityFeasibility:14.5},reason:'High erosion risk with declining vegetation cover.',availableEvidence:{satelliteTrend:true},missingEvidence:{fieldWaterConfirmation:true},source:'GeoTwin Precomputed Demo Dataset',sourceDate:'2026-07-01',status:SignalStatus.ACTIVE}));
  const geometry={type:'Polygon',coordinates:[[[78.125,17.435],[78.132,17.435],[78.132,17.441],[78.125,17.441],[78.125,17.435]]]};
  await AppDataSource.getRepository(LandPatch).save(AppDataSource.getRepository(LandPatch).create({createdByProfileId:created[OfficerRole.DISTRICT_RESTORATION_OFFICER].id,districtId:rr.id,mandalId:mandal.id,villageId:village.id,geometry,areaHectares:44.62,perimeterMetres:2886.4,centroid:{type:'Point',coordinates:[78.1285,17.438]},boundingBox:[78.125,17.435,78.132,17.441],polygonHash:createHash('sha256').update(JSON.stringify(geometry)).digest('hex'),valid:true,warnings:['Seeded deterministic demo polygon.']}));
  console.log('Seed complete. All demo users use: GeoTwinDemo@2026'); await AppDataSource.destroy();
}
seed().catch(async e=>{console.error(e);if(AppDataSource.isInitialized)await AppDataSource.destroy();process.exit(1)});
