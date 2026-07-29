import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { SupabaseAuthGuard } from '../../auth';
import {
  AssignmentStatus,
  OfficerRole,
  TaskPriority,
  TaskStatus,
} from '../../common';
import {
  AuditEvent,
  FieldTask,
  Notification,
  OfficerAssignment,
} from '../../entities';
import { FieldOperationsService } from './field-operations.service';

function repository(overrides: Record<string, unknown> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findBy: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    count: jest.fn().mockResolvedValue(0),
    update: jest
      .fn()
      .mockResolvedValue({ affected: 0 }),
    ...overrides,
  };
}

function fieldUser(profileId = 'profile-field') {
  return {
    userId: 'auth-field',
    officerProfileId: profileId,
    role: OfficerRole.FIELD_VERIFICATION_OFFICER,
    email: 'field@example.gov',
  };
}

function supervisorUser() {
  return {
    userId: 'auth-supervisor',
    officerProfileId: 'profile-supervisor',
    role: OfficerRole.DISTRICT_RESTORATION_OFFICER,
    email: 'supervisor@example.gov',
    districtId: 'district-1',
  };
}

function buildService(
  overrides: Record<string, ReturnType<typeof repository>> = {},
) {
  const repos = {
    profiles: repository(),
    regions: repository(),
    projects: repository(),
    sectors: repository(),
    assignments: repository(),
    tasks: repository(),
    reports: repository(),
    evidence: repository(),
    notifications: repository(),
    activity: repository(),
    ...overrides,
  };
  const dataSource = {
    transaction: jest.fn(),
  };
  const service = new FieldOperationsService(
    repos.profiles as never,
    repos.regions as never,
    repos.projects as never,
    repos.sectors as never,
    repos.assignments as never,
    repos.tasks as never,
    repos.reports as never,
    repos.evidence as never,
    repos.notifications as never,
    repos.activity as never,
    dataSource as never,
  );
  return { service, repos, dataSource };
}

describe('field operations security and workflow', () => {
  it('rejects an unauthenticated protected request', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const guard = new SupabaseAuthGuard(
      reflector,
      config,
      {} as JwtService,
      repository() as never,
    );
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };
    await expect(
      guard.canActivate(context as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns an empty dashboard for an unassigned officer', async () => {
    const profiles = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'profile-field',
        fullName: 'Field Officer',
        active: true,
        districtId: null,
      }),
    });
    const { service } = buildService({ profiles });
    const result = await service.getDashboard(fieldUser());
    expect(result.todayOperations).toEqual([]);
    expect(result.assignedSectors).toEqual([]);
    expect(result.priorityAction).toBeNull();
    expect(result.summary.activeAssignments).toBe(0);
  });

  it('filters assignment lists by the authenticated officer', async () => {
    const assignments = repository();
    const { service } = buildService({ assignments });
    await service.getAssignments(fieldUser('owner-1'));
    expect(assignments.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignedToProfileId: 'owner-1' },
      }),
    );
  });

  it('does not expose another officer assignment', async () => {
    const assignments = repository({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const { service } = buildService({ assignments });
    await expect(
      service.getAssignment('assignment-2', fieldUser()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assignments.findOne).toHaveBeenCalledWith({
      where: {
        id: 'assignment-2',
        assignedToProfileId: 'profile-field',
      },
    });
  });

  it('moves a pending owned task to in progress', async () => {
    const task = {
      id: 'task-1',
      title: 'Inspect sector',
      assignmentId: 'assignment-1',
      assignedToProfileId: 'profile-field',
      status: TaskStatus.PENDING,
    };
    const tasks = repository({
      findOne: jest.fn().mockResolvedValue(task),
    });
    const assignments = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'assignment-1',
        assignedToProfileId: 'profile-field',
        status: AssignmentStatus.ACCEPTED,
      }),
    });
    const { service } = buildService({
      tasks,
      assignments,
    });
    const result = await service.startTask(
      'task-1',
      fieldUser(),
    );
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    expect(tasks.save).toHaveBeenCalled();
  });

  it('rejects evidence when the task does not require it', async () => {
    const tasks = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        assignmentId: 'assignment-1',
        assignedToProfileId: 'profile-field',
        status: TaskStatus.IN_PROGRESS,
        requiresEvidence: false,
      }),
    });
    const { service } = buildService({ tasks });
    await expect(
      service.createEvidence(
        'task-1',
        {
          evidenceType: 'PHOTO',
          description: 'Site overview',
        },
        fieldUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('enforces notification recipient ownership', async () => {
    const notifications = repository({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const { service } = buildService({ notifications });
    await expect(
      service.readNotification(
        'notification-other',
        fieldUser(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(notifications.findOne).toHaveBeenCalledWith({
      where: {
        id: 'notification-other',
        recipientProfileId: 'profile-field',
      },
    });
  });

  it('creates a field report and its activity record transactionally', async () => {
    const tasks = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        title: 'Inspect sector',
        assignmentId: 'assignment-1',
        assignedToProfileId: 'profile-field',
        status: TaskStatus.IN_PROGRESS,
      }),
    });
    const assignments = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'assignment-1',
        assignedToProfileId: 'profile-field',
        assignedByProfileId: 'profile-supervisor',
      }),
    });
    const { service, dataSource } = buildService({
      tasks,
      assignments,
    });
    const savedTargets: unknown[] = [];
    const manager = {
      create: jest.fn((_target, value) => value),
      save: jest.fn(async (target, value) => {
        savedTargets.push(target);
        return { ...(value as object), id: 'saved-id' };
      }),
    };
    dataSource.transaction.mockImplementation(
      async (callback: (value: typeof manager) => unknown) =>
        callback(manager),
    );
    await service.createReport(
      'task-1',
      {
        reportType: 'FIELD_CHANGE',
        notes: 'Access road is blocked.',
      },
      fieldUser(),
    );
    expect(savedTargets).toContain(AuditEvent);
    expect(savedTargets).toContain(Notification);
  });

  it('allows a district supervisor to create an assignment transactionally', async () => {
    const profiles = repository({
      findOne: jest.fn().mockResolvedValue({
        id: 'profile-field',
        role: OfficerRole.FIELD_VERIFICATION_OFFICER,
        active: true,
      }),
    });
    const projects = repository({
      findOneBy: jest.fn().mockResolvedValue({
        id: 'project-1',
        name: 'Project',
        districtId: 'district-1',
      }),
    });
    const { service, dataSource } = buildService({
      profiles,
      projects,
    });
    const savedTargets: unknown[] = [];
    const manager = {
      create: jest.fn((_target, value) => value),
      save: jest.fn(async (target, value) => {
        savedTargets.push(target);
        if (Array.isArray(value)) return value;
        return { ...(value as object), id: 'assignment-1' };
      }),
    };
    dataSource.transaction.mockImplementation(
      async (callback: (value: typeof manager) => unknown) =>
        callback(manager),
    );
    const result = await service.createAssignment(
      {
        projectId: 'project-1',
        assignedToProfileId: 'profile-field',
        assignmentType: 'FIELD_MISSION',
        tasks: [
          {
            title: 'Verify boundary',
            taskType: 'FIELD_VERIFICATION',
            priority: TaskPriority.HIGH,
            requiresEvidence: true,
          },
        ],
      },
      supervisorUser(),
    );
    expect(result.assignment.status).toBe(
      AssignmentStatus.ASSIGNED,
    );
    expect(savedTargets).toContain(OfficerAssignment);
    expect(savedTargets).toContain(FieldTask);
    expect(savedTargets).toContain(Notification);
  });

  it('refuses a district supervisor project outside their district', async () => {
    const projects = repository({
      findOneBy: jest.fn().mockResolvedValue({
        id: 'project-2',
        districtId: 'district-2',
      }),
    });
    const { service } = buildService({ projects });
    await expect(
      service.createAssignment(
        {
          projectId: 'project-2',
          assignedToProfileId: 'profile-field',
          assignmentType: 'FIELD_MISSION',
          tasks: [],
        },
        supervisorUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
