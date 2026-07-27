import {
  CanActivate, Catch, createParamDecorator, ExecutionContext, ExceptionFilter,
  ForbiddenException, HttpException, HttpStatus, Injectable, NestInterceptor,
  SetMetadata, UnauthorizedException, CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, map } from 'rxjs';

export enum OfficerRole {
  SYSTEM_ADMINISTRATOR='SYSTEM_ADMINISTRATOR',
  STATE_PROGRAMME_OFFICER='STATE_PROGRAMME_OFFICER',
  DISTRICT_RESTORATION_OFFICER='DISTRICT_RESTORATION_OFFICER',
  TECHNICAL_RESTORATION_OFFICER='TECHNICAL_RESTORATION_OFFICER',
  FIELD_VERIFICATION_OFFICER='FIELD_VERIFICATION_OFFICER',
}
export enum CaseStatus {
  REGIONAL_SIGNAL='REGIONAL_SIGNAL', SIGNAL_ACCEPTED='SIGNAL_ACCEPTED', SIGNAL_DISMISSED='SIGNAL_DISMISSED',
  LAND_PATCH_DRAFT='LAND_PATCH_DRAFT', CASE_OPEN='CASE_OPEN', FIELD_VERIFICATION_ASSIGNED='FIELD_VERIFICATION_ASSIGNED',
  FIELD_VERIFIED='FIELD_VERIFIED', TECHNICAL_REVIEW='TECHNICAL_REVIEW', EVIDENCE_REQUIRED='EVIDENCE_REQUIRED',
  PLAN_READY='PLAN_READY', PLAN_UNDER_REVIEW='PLAN_UNDER_REVIEW', PLAN_APPROVED='PLAN_APPROVED',
  IMPLEMENTATION='IMPLEMENTATION', VERIFICATION_SUBMITTED='VERIFICATION_SUBMITTED', CORRECTION_REQUIRED='CORRECTION_REQUIRED',
  MONITORING='MONITORING', OUTCOME_REVIEW='OUTCOME_REVIEW', CLOSED='CLOSED', ARCHIVED='ARCHIVED',
}
export enum SignalStatus { ACTIVE='ACTIVE', ACCEPTED='ACCEPTED', DISMISSED='DISMISSED', SCREENING_REQUESTED='SCREENING_REQUESTED' }
export enum SignalDecisionType { ACCEPT='ACCEPT', DISMISS='DISMISS', REQUEST_SCREENING='REQUEST_SCREENING' }
export enum MissionType { INITIAL_VERIFICATION='INITIAL_VERIFICATION', EVIDENCE_GAP='EVIDENCE_GAP', IMPLEMENTATION_VISIT='IMPLEMENTATION_VISIT', MONITORING_VISIT='MONITORING_VISIT' }
export enum MissionStatus { ASSIGNED='ASSIGNED', DRAFT='DRAFT', SUBMITTED='SUBMITTED', RETURNED_FOR_CORRECTION='RETURNED_FOR_CORRECTION', ACCEPTED='ACCEPTED' }
export enum EvidenceStatus { SUBMITTED='SUBMITTED', VALIDATED='VALIDATED', NEEDS_CLARIFICATION='NEEDS_CLARIFICATION', SUPERSEDED='SUPERSEDED', REJECTED='REJECTED' }
export enum EvidenceDebtLevel { LOW='LOW', MODERATE='MODERATE', HIGH='HIGH', BLOCKING='BLOCKING' }
export enum AssessmentStatus { DRAFT='DRAFT', SUBMITTED='SUBMITTED', SUPERSEDED='SUPERSEDED' }
export enum TechnicalModuleType { SOIL_AND_EROSION='SOIL_AND_EROSION', WATER_AND_WATERSHED='WATER_AND_WATERSHED', VEGETATION_AND_BIODIVERSITY='VEGETATION_AND_BIODIVERSITY', AGRICULTURE_AND_LAND_PRODUCTIVITY='AGRICULTURE_AND_LAND_PRODUCTIVITY', ENVIRONMENTAL_SAFEGUARDS='ENVIRONMENTAL_SAFEGUARDS', COMMUNITY_AND_MAINTENANCE_FEASIBILITY='COMMUNITY_AND_MAINTENANCE_FEASIBILITY' }
export enum PlanType { NO_ACTION_BASELINE='NO_ACTION_BASELINE', PLAN_A='PLAN_A', PLAN_B='PLAN_B' }
export enum PlanStatus { DRAFT='DRAFT', SUBMITTED='SUBMITTED', APPROVED='APPROVED', SUPERSEDED='SUPERSEDED', REJECTED='REJECTED' }
export enum DeviationCategory { NONE='NONE', MINOR='MINOR', MAJOR='MAJOR', BLOCKING='BLOCKING' }
export enum AIProposalStatus { PENDING='PENDING', CONFIRMED='CONFIRMED', REJECTED='REJECTED' }

export enum ErrorCode {
  UNAUTHENTICATED='UNAUTHENTICATED', FORBIDDEN='FORBIDDEN', OUT_OF_SCOPE='OUT_OF_SCOPE',
  VALIDATION_FAILED='VALIDATION_FAILED', INVALID_TRANSITION='INVALID_TRANSITION', GATE_BLOCKED='GATE_BLOCKED',
  VERSION_CONFLICT='VERSION_CONFLICT', NOT_FOUND='NOT_FOUND', CONFLICT='CONFLICT',
  AI_PROVIDER_UNAVAILABLE='AI_PROVIDER_UNAVAILABLE', EXTERNAL_PROVIDER_UNAVAILABLE='EXTERNAL_PROVIDER_UNAVAILABLE',
  INTERNAL_ERROR='INTERNAL_ERROR',
}
export class ApiException extends HttpException {
  constructor(public code: ErrorCode, message: string, status: number, public details?: unknown) {
    super({ code, message, details }, status);
  }
}
export interface AuthenticatedUser {
  userId: string; officerProfileId: string; role: OfficerRole; email: string;
  stateId?: string | null; districtId?: string | null;
}
export const IS_PUBLIC_KEY='isPublic';
export const ROLES_KEY='roles';
export const Public=()=>SetMetadata(IS_PUBLIC_KEY,true);
export const Roles=(...roles:OfficerRole[])=>SetMetadata(ROLES_KEY,roles);
export const CurrentUser=createParamDecorator((_d:unknown,ctx:ExecutionContext)=>ctx.switchToHttp().getRequest().user as AuthenticatedUser);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector:Reflector){super();}
  override canActivate(ctx:ExecutionContext){
    if(this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY,[ctx.getHandler(),ctx.getClass()])) return true;
    return super.canActivate(ctx);
  }
  override handleRequest<TUser=AuthenticatedUser>(err:unknown,user:TUser){
    if(err||!user) throw err??new UnauthorizedException('Authentication required.');
    return user;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector:Reflector){}
  canActivate(ctx:ExecutionContext){
    const roles=this.reflector.getAllAndOverride<OfficerRole[]>(ROLES_KEY,[ctx.getHandler(),ctx.getClass()]);
    if(!roles?.length)return true;
    const user=ctx.switchToHttp().getRequest().user as AuthenticatedUser|undefined;
    if(!user||!roles.includes(user.role))throw new ForbiddenException('This role cannot perform this action.');
    return true;
  }
}
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(ctx:ExecutionContext,next:CallHandler):Observable<unknown>{
    const req=ctx.switchToHttp().getRequest<FastifyRequest>();
    return next.handle().pipe(map(data=>({data,requestId:req.id,timestamp:new Date().toISOString(),warnings:[]})));
  }
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error:unknown,host:import('@nestjs/common').ArgumentsHost){
    const req=host.switchToHttp().getRequest<FastifyRequest>();
    const res=host.switchToHttp().getResponse<FastifyReply>();
    let status=HttpStatus.INTERNAL_SERVER_ERROR;
    let code=ErrorCode.INTERNAL_ERROR;
    let message='An unexpected error occurred.';
    let fieldErrors:unknown[]=[];
    if(error instanceof HttpException){
      status=error.getStatus(); const body=error.getResponse() as any;
      if(typeof body==='string')message=body; else {code=body.code??(status===400?ErrorCode.VALIDATION_FAILED:ErrorCode.INTERNAL_ERROR);message=Array.isArray(body.message)?'Validation failed.':body.message??message;fieldErrors=Array.isArray(body.message)?body.message.map((x:string)=>({message:x})):body.fieldErrors??[];}
    }
    void res.status(status).send({error:{code,message,fieldErrors},requestId:req.id,timestamp:new Date().toISOString()});
  }
}
