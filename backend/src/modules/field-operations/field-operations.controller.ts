import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  AuthenticatedUser,
  CurrentUser,
  OfficerRole,
  Roles,
} from '../../common';
import {
  AddAssignmentTasksDto,
  CreateAssignmentDto,
  CreateEvidenceDto,
  CreateFieldReportDto,
  CreateProjectDto,
  CreateSectorDto,
  FieldTaskFiltersDto,
} from './dto/field-operations.dto';
import { FieldOperationsService } from './field-operations.service';

const FIELD_ROLES = [
  OfficerRole.FIELD_VERIFICATION_OFFICER,
];

const SUPERVISOR_ROLES = [
  OfficerRole.DISTRICT_RESTORATION_OFFICER,
  OfficerRole.STATE_PROGRAMME_OFFICER,
  OfficerRole.SYSTEM_ADMINISTRATOR,
];

@Controller('field')
@Roles(...FIELD_ROLES)
export class FieldOperationsController {
  constructor(
    private readonly service: FieldOperationsService,
  ) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getDashboard(user);
  }

  @Get('assignments')
  assignments(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getAssignments(user);
  }

  @Get('assignments/:assignmentId')
  assignment(
    @Param('assignmentId', ParseUUIDPipe)
    assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getAssignment(assignmentId, user);
  }

  @Patch('assignments/:assignmentId/accept')
  acceptAssignment(
    @Param('assignmentId', ParseUUIDPipe)
    assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.acceptAssignment(assignmentId, user);
  }

  @Get('tasks')
  tasks(
    @Query() filters: FieldTaskFiltersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getTasks(filters, user);
  }

  @Get('tasks/:taskId')
  task(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getTask(taskId, user);
  }

  @Patch('tasks/:taskId/start')
  startTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startTask(taskId, user);
  }

  @Post('tasks/:taskId/reports')
  report(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateFieldReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createReport(taskId, dto, user);
  }

  @Post('tasks/:taskId/evidence')
  evidence(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createEvidence(taskId, dto, user);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getNotifications(user);
  }

  @Patch('notifications/read-all')
  readAllNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.readAllNotifications(user);
  }

  @Patch('notifications/:notificationId/read')
  readNotification(
    @Param('notificationId', ParseUUIDPipe)
    notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.readNotification(
      notificationId,
      user,
    );
  }
}

@Controller('supervisor')
@Roles(...SUPERVISOR_ROLES)
export class SupervisorOperationsController {
  constructor(
    private readonly service: FieldOperationsService,
  ) {}

  @Get('field-officers')
  fieldOfficers() {
    return this.service.getFieldOfficers();
  }

  @Get('projects')
  projects(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getProjects(user);
  }

  @Post('projects')
  createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createProject(dto, user);
  }

  @Get('projects/:projectId/sectors')
  sectors(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getProjectSectors(projectId, user);
  }

  @Post('projects/:projectId/sectors')
  createSector(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateSectorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createSector(projectId, dto, user);
  }

  @Post('assignments')
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createAssignment(dto, user);
  }

  @Post('assignments/:assignmentId/tasks')
  addTasks(
    @Param('assignmentId', ParseUUIDPipe)
    assignmentId: string,
    @Body() dto: AddAssignmentTasksDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addAssignmentTasks(
      assignmentId,
      dto.tasks,
      user,
    );
  }

  @Get('assignments')
  assignments(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getSupervisorAssignments(user);
  }

  @Patch('evidence/:evidenceId/review')
  reviewEvidence(
    @Param('evidenceId') evidenceId: string,
    @Body() dto: { status: string; notes?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reviewEvidence(evidenceId, dto.status, dto.notes, user);
  }

  @Patch('field-officers/:officerId/attendance')
  toggleAttendance(
    @Param('officerId') officerId: string,
    @Body() dto: { status: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.toggleAttendance(officerId, dto.status, user);
  }

  @Get('audit-logs')
  auditLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getAuditLogs(user);
  }

  @Post('audit-logs')
  createAuditLog(
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createAuditLog(dto, user);
  }
}
