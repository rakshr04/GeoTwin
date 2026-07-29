import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import {
  AssignmentStatus,
  AuthenticatedUser,
  EvidenceStatus,
  OfficerRole,
  TaskPriority,
  TaskStatus,
} from '../../common';
import {
  AuditEvent,
  EvidenceItem,
  FieldReport,
  FieldTask,
  LandSector,
  Notification,
  OfficerAssignment,
  OfficerProfile,
  Region,
  RestorationProject,
} from '../../entities';
import {
  AssignmentTaskDto,
  CreateAssignmentDto,
  CreateEvidenceDto,
  CreateFieldReportDto,
  CreateProjectDto,
  CreateSectorDto,
  FieldTaskFiltersDto,
} from './dto/field-operations.dto';

const ACTIVE_ASSIGNMENT_STATUSES = [
  AssignmentStatus.ASSIGNED,
  AssignmentStatus.ACCEPTED,
  AssignmentStatus.IN_PROGRESS,
  AssignmentStatus.SUBMITTED,
];

const INCOMPLETE_TASK_STATUSES = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.SUBMITTED,
  TaskStatus.BLOCKED,
];

@Injectable()
export class FieldOperationsService {
  constructor(
    @InjectRepository(OfficerProfile)
    private readonly profiles: Repository<OfficerProfile>,
    @InjectRepository(Region)
    private readonly regions: Repository<Region>,
    @InjectRepository(RestorationProject)
    private readonly projects: Repository<RestorationProject>,
    @InjectRepository(LandSector)
    private readonly sectors: Repository<LandSector>,
    @InjectRepository(OfficerAssignment)
    private readonly assignments: Repository<OfficerAssignment>,
    @InjectRepository(FieldTask)
    private readonly tasks: Repository<FieldTask>,
    @InjectRepository(FieldReport)
    private readonly reports: Repository<FieldReport>,
    @InjectRepository(EvidenceItem)
    private readonly evidence: Repository<EvidenceItem>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(AuditEvent)
    private readonly activity: Repository<AuditEvent>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getDashboard(user: AuthenticatedUser) {
    const profile = await this.requireActiveProfile(user);
    const assignments = await this.assignments.find({
      where: {
        assignedToProfileId: profile.id,
        status: In(ACTIVE_ASSIGNMENT_STATUSES),
      },
      order: { createdAt: 'DESC' },
    });
    const assignmentIds = assignments.map(
      (assignment) => assignment.id,
    );
    const tasks = assignmentIds.length
      ? await this.tasks.find({
          where: {
            assignedToProfileId: profile.id,
            assignmentId: In(assignmentIds),
            status: Not(TaskStatus.CANCELLED),
          },
          order: { dueAt: 'ASC', createdAt: 'DESC' },
        })
      : [];
    const projectIds = [
      ...new Set(assignments.map((item) => item.projectId)),
    ];
    const sectorIds = [
      ...new Set(
        assignments
          .map((item) => item.sectorId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [projects, sectors, district] = await Promise.all([
      projectIds.length
        ? this.projects.findBy({ id: In(projectIds) })
        : [],
      sectorIds.length
        ? this.sectors.findBy({ id: In(sectorIds) })
        : [],
      profile.districtId
        ? this.regions.findOneBy({ id: profile.districtId })
        : null,
    ]);
    const projectMap = new Map(
      projects.map((project) => [project.id, project]),
    );
    const sectorMap = new Map(
      sectors.map((sector) => [sector.id, sector]),
    );
    const assignmentMap = new Map(
      assignments.map((assignment) => [
        assignment.id,
        assignment,
      ]),
    );

    const now = new Date();
    const today = this.dateKey(now);
    const incompleteTasks = tasks.filter((task) =>
      INCOMPLETE_TASK_STATUSES.includes(task.status),
    );
    const priorityTask =
      this.pickPriorityTask(incompleteTasks);
    const priorityAssignment = priorityTask
      ? assignmentMap.get(priorityTask.assignmentId)
      : assignments[0];

    const todayOperations = tasks
      .filter((task) => {
        const dueKey = task.dueAt
          ? this.dateKey(task.dueAt)
          : null;
        return (
          (dueKey !== null && dueKey <= today) ||
          this.dateKey(task.createdAt) === today
        );
      })
      .sort((a, b) => this.compareTasks(a, b))
      .slice(0, 8)
      .map((task) =>
        this.taskView(task, assignmentMap, projectMap),
      );

    const assignedSectors = sectorIds
      .map((sectorId) => {
        const sector = sectorMap.get(sectorId);
        const assignment = assignments.find(
          (item) => item.sectorId === sectorId,
        );
        if (!sector || !assignment) {
          return null;
        }
        const sectorTasks = tasks.filter(
          (task) => task.assignmentId === assignment.id,
        );
        const activeTasks = sectorTasks.filter(
          (task) => task.status !== TaskStatus.CANCELLED,
        );
        const completed = activeTasks.filter(
          (task) => task.status === TaskStatus.COMPLETED,
        ).length;
        return {
          id: sector.id,
          assignmentId: assignment.id,
          projectId: assignment.projectId,
          projectName:
            projectMap.get(assignment.projectId)?.name ??
            'Restoration project',
          name: sector.name,
          villageName: sector.villageName ?? null,
          mandalName: sector.mandalName ?? null,
          districtName: sector.districtName ?? null,
          areaHectares: Number(sector.areaHectares),
          geometry: sector.geometry,
          centroid: sector.centroid ?? null,
          assignmentStatus: assignment.status,
          dueDate: assignment.dueDate ?? null,
          progress:
            activeTasks.length === 0
              ? 0
              : Math.round(
                  (completed / activeTasks.length) * 100,
                ),
          completedTasks: completed,
          totalTasks: activeTasks.length,
        };
      })
      .filter(Boolean);

    const criticalAlerts = [
      ...incompleteTasks
        .filter(
          (task) =>
            task.dueAt &&
            task.dueAt < now &&
            [TaskPriority.CRITICAL, TaskPriority.HIGH].includes(
              task.priority,
            ),
        )
        .map((task) => ({
          id: `task-${task.id}`,
          type: 'OVERDUE_TASK',
          severity:
            task.priority === TaskPriority.CRITICAL
              ? 'CRITICAL'
              : 'HIGH',
          message: `${task.title} is overdue.`,
          taskId: task.id,
          assignmentId: task.assignmentId,
        })),
      ...assignments
        .filter((assignment) => {
          if (!assignment.dueDate) {
            return false;
          }
          const days =
            (new Date(
              `${assignment.dueDate}T23:59:59.999Z`,
            ).getTime() -
              now.getTime()) /
            86_400_000;
          return days >= 0 && days <= 2;
        })
        .map((assignment) => ({
          id: `assignment-${assignment.id}`,
          type: 'ASSIGNMENT_DUE_SOON',
          severity: 'HIGH',
          message: `Assignment is due on ${assignment.dueDate}.`,
          assignmentId: assignment.id,
        })),
    ];

    const recentActivity = assignmentIds.length
      ? await this.activity.find({
          where: {
            assignmentId: In(assignmentIds),
          },
          order: { createdAt: 'DESC' },
          take: 8,
        })
      : [];
    const notificationCount = await this.notifications.count({
      where: {
        recipientProfileId: profile.id,
        readAt: IsNull(),
      },
    });

    return {
      officer: {
        id: profile.id,
        displayName: profile.fullName,
        role: profile.role,
        districtName: district?.name ?? null,
      },
      priorityAction: priorityTask
        ? this.taskView(
            priorityTask,
            assignmentMap,
            projectMap,
          )
        : null,
      todayOperations,
      assignedSectors,
      workflow: this.workflowView(
        priorityAssignment,
        tasks,
      ),
      criticalAlerts,
      recentActivity: recentActivity.map((event) => ({
        id: event.id,
        action: event.action,
        entityType: event.targetType,
        entityId: event.targetId ?? null,
        assignmentId: event.assignmentId ?? null,
        message:
          typeof event.metadata?.message === 'string'
            ? event.metadata.message
            : event.action
                .toLowerCase()
                .replaceAll('_', ' '),
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
      notificationCount,
      summary: {
        activeAssignments: assignments.length,
        pendingTasks: tasks.filter(
          (task) => task.status === TaskStatus.PENDING,
        ).length,
        overdueTasks: incompleteTasks.filter(
          (task) => task.dueAt && task.dueAt < now,
        ).length,
        completedTasks: tasks.filter(
          (task) => task.status === TaskStatus.COMPLETED,
        ).length,
      },
    };
  }

  async getAssignments(user: AuthenticatedUser) {
    const assignments = await this.assignments.find({
      where: { assignedToProfileId: user.officerProfileId },
      order: { createdAt: 'DESC' },
    });
    return this.hydrateAssignments(assignments);
  }

  async getAssignment(
    assignmentId: string,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.requireOwnedAssignment(
      assignmentId,
      user,
    );
    const [item] = await this.hydrateAssignments([assignment]);
    return item;
  }

  async acceptAssignment(
    assignmentId: string,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.requireOwnedAssignment(
      assignmentId,
      user,
    );
    if (assignment.status !== AssignmentStatus.ASSIGNED) {
      throw new ConflictException(
        'Only a newly assigned assignment can be accepted.',
      );
    }
    assignment.status = AssignmentStatus.ACCEPTED;
    const saved = await this.assignments.save(assignment);
    await this.activity.save(
      this.activity.create({
        actorProfileId: user.officerProfileId,
        actorRole: user.role,
        action: 'ASSIGNMENT_ACCEPTED',
        targetType: 'OfficerAssignment',
        targetId: assignment.id,
        assignmentId: assignment.id,
        metadata: { message: 'Assignment accepted.' },
      }),
    );
    return saved;
  }

  async getTasks(
    filters: FieldTaskFiltersDto,
    user: AuthenticatedUser,
  ) {
    const where: Record<string, unknown> = {
      assignedToProfileId: user.officerProfileId,
    };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.assignmentId) {
      await this.requireOwnedAssignment(
        filters.assignmentId,
        user,
      );
      where.assignmentId = filters.assignmentId;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    let tasks = await this.tasks.find({
      where,
      order: { dueAt: 'ASC', createdAt: 'DESC' },
    });
    if (filters.due === 'today') {
      const today = this.dateKey(new Date());
      tasks = tasks.filter(
        (task) =>
          task.dueAt && this.dateKey(task.dueAt) === today,
      );
    }
    return this.hydrateTasks(tasks);
  }

  async getTask(taskId: string, user: AuthenticatedUser) {
    const task = await this.requireOwnedTask(taskId, user);
    const [view] = await this.hydrateTasks([task]);
    return view;
  }

  async startTask(taskId: string, user: AuthenticatedUser) {
    const task = await this.requireOwnedTask(taskId, user);
    if (task.status !== TaskStatus.PENDING) {
      throw new ConflictException(
        'Only a pending task can be started.',
      );
    }
    task.status = TaskStatus.IN_PROGRESS;
    const assignment = await this.requireOwnedAssignment(
      task.assignmentId,
      user,
    );
    if (
      [
        AssignmentStatus.ASSIGNED,
        AssignmentStatus.ACCEPTED,
      ].includes(assignment.status)
    ) {
      assignment.status = AssignmentStatus.IN_PROGRESS;
      await this.assignments.save(assignment);
    }
    const saved = await this.tasks.save(task);
    await this.activity.save(
      this.activity.create({
        actorProfileId: user.officerProfileId,
        actorRole: user.role,
        action: 'TASK_STARTED',
        targetType: 'FieldTask',
        targetId: task.id,
        assignmentId: task.assignmentId,
        metadata: { message: `Started task: ${task.title}` },
      }),
    );
    return saved;
  }

  async createReport(
    taskId: string,
    dto: CreateFieldReportDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.requireOwnedTask(taskId, user);
    this.assertTaskAcceptsSubmission(task);
    const assignment = await this.requireOwnedAssignment(
      task.assignmentId,
      user,
    );
    return this.dataSource.transaction(async (manager) => {
      const report = await manager.save(
        FieldReport,
        manager.create(FieldReport, {
          taskId: task.id,
          assignmentId: assignment.id,
          submittedByProfileId: user.officerProfileId,
          reportType: dto.reportType,
          notes: dto.notes,
          changeCategory: dto.changeCategory,
          latitude: dto.latitude,
          longitude: dto.longitude,
          payload: dto.payload ?? {},
        }),
      );
      await manager.save(
        AuditEvent,
        manager.create(AuditEvent, {
          actorProfileId: user.officerProfileId,
          actorRole: user.role,
          action: 'FIELD_CHANGE_REPORTED',
          targetType: 'FieldReport',
          targetId: report.id,
          assignmentId: assignment.id,
          metadata: {
            taskId: task.id,
            message: `Reported field change for ${task.title}.`,
          },
        }),
      );
      await manager.save(
        Notification,
        manager.create(Notification, {
          recipientProfileId: assignment.assignedByProfileId,
          type: 'FIELD_REPORT_SUBMITTED',
          title: 'Field change reported',
          message: `${task.title}: ${dto.notes.slice(0, 160)}`,
          deepLink: `/supervisor/assignments/${assignment.id}`,
        }),
      );
      return report;
    });
  }

  async createEvidence(
    taskId: string,
    dto: CreateEvidenceDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.requireOwnedTask(taskId, user);
    if (!task.requiresEvidence) {
      throw new ForbiddenException(
        'This task does not request evidence.',
      );
    }
    this.assertTaskAcceptsSubmission(task);
    const item = await this.evidence.save(
      this.evidence.create({
        taskId: task.id,
        assignmentId: task.assignmentId,
        type: dto.evidenceType,
        status: EvidenceStatus.SUBMITTED,
        source: 'FIELD_TASK',
        sourceDate: this.dateKey(
          dto.capturedAt
            ? new Date(dto.capturedAt)
            : new Date(),
        ),
        submittedByProfileId: user.officerProfileId,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        capturedAt: dto.capturedAt
          ? new Date(dto.capturedAt)
          : null,
        metadata: {
          ...(dto.metadata ?? {}),
          uploadStatus: 'METADATA_ONLY',
        },
        payload: {},
      }),
    );
    await this.activity.save(
      this.activity.create({
        actorProfileId: user.officerProfileId,
        actorRole: user.role,
        action: 'EVIDENCE_METADATA_SUBMITTED',
        targetType: 'EvidenceItem',
        targetId: item.id,
        assignmentId: task.assignmentId,
        metadata: {
          taskId: task.id,
          message: `Submitted evidence metadata for ${task.title}.`,
        },
      }),
    );
    return {
      ...item,
      uploadStatus: 'METADATA_ONLY',
      message:
        'Evidence metadata was saved. File upload is not configured.',
    };
  }

  async getNotifications(user: AuthenticatedUser) {
    return this.notifications.find({
      where: { recipientProfileId: user.officerProfileId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async readNotification(
    notificationId: string,
    user: AuthenticatedUser,
  ) {
    const notification = await this.notifications.findOne({
      where: {
        id: notificationId,
        recipientProfileId: user.officerProfileId,
      },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    notification.readAt ??= new Date();
    return this.notifications.save(notification);
  }

  async readAllNotifications(user: AuthenticatedUser) {
    const result = await this.notifications.update(
      {
        recipientProfileId: user.officerProfileId,
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async getFieldOfficers() {
    const profiles = await this.profiles.find({
      where: [
        {
          role: OfficerRole.FIELD_VERIFICATION_OFFICER,
          active: true,
        },
      ],
      order: { fullName: 'ASC' },
    });
    return profiles.map((profile) => ({
      id: profile.id,
      displayName: profile.fullName,
      email: profile.email ?? null,
      role: profile.role,
      districtId: profile.districtId ?? null,
      active: profile.active,
    }));
  }

  async getProjects(user: AuthenticatedUser) {
    const projects = await this.projects.find({
      where:
        user.role ===
          OfficerRole.DISTRICT_RESTORATION_OFFICER &&
        user.districtId
          ? { districtId: user.districtId }
          : {},
      order: { createdAt: 'DESC' },
    });
    return projects;
  }

  async createProject(
    dto: CreateProjectDto,
    user: AuthenticatedUser,
  ) {
    const districtId = dto.districtId ?? user.districtId;
    this.assertDistrictScope(districtId, user);
    return this.projects.save(
      this.projects.create({
        name: dto.name,
        description: dto.description,
        districtId,
        status: 'ACTIVE',
        createdByProfileId: user.officerProfileId,
      }),
    );
  }

  async getProjectSectors(
    projectId: string,
    user: AuthenticatedUser,
  ) {
    await this.requireProjectInScope(projectId, user);
    return this.sectors.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  async createSector(
    projectId: string,
    dto: CreateSectorDto,
    user: AuthenticatedUser,
  ) {
    await this.requireProjectInScope(projectId, user);
    this.assertGeoJson(dto.geometry);
    return this.sectors.save(
      this.sectors.create({
        projectId,
        name: dto.name,
        villageName: dto.villageName,
        mandalName: dto.mandalName,
        districtName: dto.districtName,
        areaHectares: dto.areaHectares,
        geometry: dto.geometry,
        centroid: dto.centroid,
        status: 'ACTIVE',
      }),
    );
  }

  async createAssignment(
    dto: CreateAssignmentDto,
    user: AuthenticatedUser,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    if (dto.dueDate && dto.dueDate < today) {
      throw new BadRequestException(
        'Assignment due date cannot be in the past.',
      );
    }
    if (
      dto.startDate &&
      dto.dueDate &&
      dto.startDate > dto.dueDate
    ) {
      throw new BadRequestException(
        'Assignment due date must be on or after its start date.',
      );
    }
    if (
      dto.dueDate &&
      dto.tasks.some(
        (task) =>
          task.dueAt &&
          task.dueAt.slice(0, 10) > dto.dueDate!,
      )
    ) {
      throw new BadRequestException(
        'Task due dates cannot be later than the assignment due date.',
      );
    }
    const project = await this.requireProjectInScope(
      dto.projectId,
      user,
    );
    const officer = await this.profiles.findOne({
      where: { id: dto.assignedToProfileId, active: true },
    });
    if (
      !officer ||
      ![
        OfficerRole.FIELD_VERIFICATION_OFFICER,
      ].includes(officer.role)
    ) {
      throw new BadRequestException(
        'The selected active field officer was not found.',
      );
    }
    const sector = dto.sectorId
      ? await this.sectors.findOneBy({ id: dto.sectorId })
      : null;
    if (
      dto.sectorId &&
      (!sector || sector.projectId !== project.id)
    ) {
      throw new BadRequestException(
        'The selected sector does not belong to the project.',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const assignment = await manager.save(
        OfficerAssignment,
        manager.create(OfficerAssignment, {
          projectId: project.id,
          sectorId: sector?.id,
          assignedToProfileId: officer.id,
          assignedByProfileId: user.officerProfileId,
          assignmentType: dto.assignmentType,
          status: AssignmentStatus.ASSIGNED,
          startDate: dto.startDate,
          dueDate: dto.dueDate,
          instructions: dto.instructions,
        }),
      );
      const tasks = await this.saveTasks(
        manager,
        assignment,
        dto.tasks,
        user,
      );
      const notification = await manager.save(
        Notification,
        manager.create(Notification, {
          recipientProfileId: officer.id,
          type: 'ASSIGNMENT_CREATED',
          title: 'New field assignment',
          message: `${project.name}${sector ? ` — ${sector.name}` : ''}`,
          deepLink: `/field/assignments/${assignment.id}`,
        }),
      );
      await manager.save(
        AuditEvent,
        manager.create(AuditEvent, {
          actorProfileId: user.officerProfileId,
          actorRole: user.role,
          action: 'FIELD_ASSIGNMENT_CREATED',
          targetType: 'OfficerAssignment',
          targetId: assignment.id,
          assignmentId: assignment.id,
          metadata: {
            assignedToProfileId: officer.id,
            taskCount: tasks.length,
            notificationId: notification.id,
            message: `Assignment issued for ${project.name}.`,
          },
        }),
      );
      return { assignment, tasks, notification };
    });
  }

  async addAssignmentTasks(
    assignmentId: string,
    tasks: AssignmentTaskDto[],
    user: AuthenticatedUser,
  ) {
    const assignment = await this.requireSupervisorAssignment(
      assignmentId,
      user,
    );
    if (
      [AssignmentStatus.CANCELLED, AssignmentStatus.COMPLETED].includes(
        assignment.status,
      )
    ) {
      throw new ConflictException(
        'Tasks cannot be added to a closed assignment.',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const saved = await this.saveTasks(
        manager,
        assignment,
        tasks,
        user,
      );
      await manager.save(
        Notification,
        manager.create(Notification, {
          recipientProfileId: assignment.assignedToProfileId,
          type: 'TASKS_ADDED',
          title: 'Assignment updated',
          message: `${saved.length} task${saved.length === 1 ? '' : 's'} added.`,
          deepLink: `/field/assignments/${assignment.id}`,
        }),
      );
      return saved;
    });
  }

  async getSupervisorAssignments(
    user: AuthenticatedUser,
  ) {
    const assignments = await this.assignments.find({
      where:
        user.role === OfficerRole.SYSTEM_ADMINISTRATOR ||
        user.role === OfficerRole.STATE_PROGRAMME_OFFICER
          ? {}
          : { assignedByProfileId: user.officerProfileId },
      order: { createdAt: 'DESC' },
    });
    return this.hydrateAssignments(assignments);
  }

  private async requireActiveProfile(
    user: AuthenticatedUser,
  ) {
    const profile = await this.profiles.findOne({
      where: {
        id: user.officerProfileId,
        active: true,
      },
    });
    if (!profile) {
      throw new ForbiddenException(
        'Officer profile is inactive or unavailable.',
      );
    }
    return profile;
  }

  private async requireOwnedAssignment(
    assignmentId: string,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.assignments.findOne({
      where: {
        id: assignmentId,
        assignedToProfileId: user.officerProfileId,
      },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }
    return assignment;
  }

  private async requireSupervisorAssignment(
    assignmentId: string,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.assignments.findOneBy({
      id: assignmentId,
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }
    if (
      ![
        OfficerRole.SYSTEM_ADMINISTRATOR,
        OfficerRole.STATE_PROGRAMME_OFFICER,
      ].includes(user.role) &&
      assignment.assignedByProfileId !== user.officerProfileId
    ) {
      throw new NotFoundException('Assignment not found.');
    }
    return assignment;
  }

  private async requireOwnedTask(
    taskId: string,
    user: AuthenticatedUser,
  ) {
    const task = await this.tasks.findOne({
      where: {
        id: taskId,
        assignedToProfileId: user.officerProfileId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return task;
  }

  private async requireProjectInScope(
    projectId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.projects.findOneBy({
      id: projectId,
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    this.assertDistrictScope(project.districtId, user);
    return project;
  }

  private assertDistrictScope(
    districtId: string | null | undefined,
    user: AuthenticatedUser,
  ) {
    if (
      user.role ===
        OfficerRole.DISTRICT_RESTORATION_OFFICER &&
      (!user.districtId || districtId !== user.districtId)
    ) {
      throw new ForbiddenException(
        'Project is outside your district.',
      );
    }
  }

  private assertGeoJson(geometry: Record<string, unknown>) {
    if (
      !['Polygon', 'MultiPolygon'].includes(
        String(geometry.type),
      ) ||
      !Array.isArray(geometry.coordinates)
    ) {
      throw new BadRequestException(
        'Geometry must be a GeoJSON Polygon or MultiPolygon.',
      );
    }
  }

  private assertTaskAcceptsSubmission(task: FieldTask) {
    if (
      ![
        TaskStatus.PENDING,
        TaskStatus.IN_PROGRESS,
        TaskStatus.BLOCKED,
      ].includes(task.status)
    ) {
      throw new ConflictException(
        'This task does not currently accept submissions.',
      );
    }
  }

  private async saveTasks(
    manager: EntityManager,
    assignment: OfficerAssignment,
    taskDtos: AssignmentTaskDto[],
    user: AuthenticatedUser,
  ) {
    if (taskDtos.length === 0) {
      return [];
    }
    return manager.save(
      FieldTask,
      taskDtos.map((dto) =>
        manager.create(FieldTask, {
          assignmentId: assignment.id,
          title: dto.title,
          description: dto.description,
          taskType: dto.taskType,
          priority: dto.priority,
          status: TaskStatus.PENDING,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          requiresEvidence: dto.requiresEvidence,
          createdByProfileId: user.officerProfileId,
          assignedToProfileId:
            assignment.assignedToProfileId,
        }),
      ),
    );
  }

  private async hydrateAssignments(
    assignments: OfficerAssignment[],
  ) {
    const projectIds = [
      ...new Set(assignments.map((item) => item.projectId)),
    ];
    const sectorIds = assignments
      .map((item) => item.sectorId)
      .filter((id): id is string => Boolean(id));
    const assignmentIds = assignments.map((item) => item.id);
    const [projects, sectors, tasks] = await Promise.all([
      projectIds.length
        ? this.projects.findBy({ id: In(projectIds) })
        : [],
      sectorIds.length
        ? this.sectors.findBy({ id: In(sectorIds) })
        : [],
      assignmentIds.length
        ? this.tasks.findBy({
            assignmentId: In(assignmentIds),
          })
        : [],
    ]);
    const projectMap = new Map(
      projects.map((item) => [item.id, item]),
    );
    const sectorMap = new Map(
      sectors.map((item) => [item.id, item]),
    );
    return assignments.map((assignment) => ({
      ...assignment,
      project: projectMap.get(assignment.projectId) ?? null,
      sector: assignment.sectorId
        ? sectorMap.get(assignment.sectorId) ?? null
        : null,
      tasks: tasks
        .filter(
          (task) => task.assignmentId === assignment.id,
        )
        .sort((a, b) => this.compareTasks(a, b)),
    }));
  }

  private async hydrateTasks(tasks: FieldTask[]) {
    const assignmentIds = [
      ...new Set(tasks.map((task) => task.assignmentId)),
    ];
    const assignments = assignmentIds.length
      ? await this.assignments.findBy({
          id: In(assignmentIds),
        })
      : [];
    const projectIds = [
      ...new Set(assignments.map((item) => item.projectId)),
    ];
    const projects = projectIds.length
      ? await this.projects.findBy({ id: In(projectIds) })
      : [];
    return tasks.map((task) =>
      this.taskView(
        task,
        new Map(
          assignments.map((item) => [item.id, item]),
        ),
        new Map(projects.map((item) => [item.id, item])),
      ),
    );
  }

  private taskView(
    task: FieldTask,
    assignments: Map<string, OfficerAssignment>,
    projects: Map<string, RestorationProject>,
  ) {
    const assignment = assignments.get(task.assignmentId);
    return {
      id: task.id,
      assignmentId: task.assignmentId,
      title: task.title,
      description: task.description ?? null,
      taskType: task.taskType,
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt ?? null,
      requiresEvidence: task.requiresEvidence,
      createdAt: task.createdAt,
      projectId: assignment?.projectId ?? null,
      projectName: assignment
        ? projects.get(assignment.projectId)?.name ?? null
        : null,
      assignmentStatus: assignment?.status ?? null,
    };
  }

  private workflowView(
    assignment: OfficerAssignment | undefined,
    tasks: FieldTask[],
  ) {
    if (!assignment) {
      return { assignmentId: null, stages: [] };
    }
    const assignmentTasks = tasks.filter(
      (task) => task.assignmentId === assignment.id,
    );
    const accepted =
      assignment.status !== AssignmentStatus.ASSIGNED;
    const submitted = [
      AssignmentStatus.SUBMITTED,
      AssignmentStatus.COMPLETED,
    ].includes(assignment.status);
    const completed =
      assignment.status === AssignmentStatus.COMPLETED;
    return {
      assignmentId: assignment.id,
      stages: [
        {
          name: 'Assignment Received',
          status: 'COMPLETED',
        },
        {
          name: 'Assignment Accepted',
          status: accepted
            ? 'COMPLETED'
            : 'CURRENT',
        },
        ...(accepted
          ? [
              {
                name: 'Field Work',
                status: submitted
                  ? 'COMPLETED'
                  : 'CURRENT',
                completedTasks: assignmentTasks.filter(
                  (task) =>
                    task.status === TaskStatus.COMPLETED,
                ).length,
                totalTasks: assignmentTasks.filter(
                  (task) =>
                    task.status !== TaskStatus.CANCELLED,
                ).length,
              },
            ]
          : []),
        ...(submitted
          ? [
              {
                name: 'Supervisor Review',
                status: completed
                  ? 'COMPLETED'
                  : 'CURRENT',
              },
            ]
          : []),
      ],
    };
  }

  private pickPriorityTask(tasks: FieldTask[]) {
    return [...tasks].sort((a, b) =>
      this.compareTasks(a, b),
    )[0];
  }

  private compareTasks(a: FieldTask, b: FieldTask) {
    const now = Date.now();
    const rank = (task: FieldTask) => {
      const overdue =
        task.dueAt && task.dueAt.getTime() < now;
      if (overdue && task.priority === TaskPriority.CRITICAL) {
        return 0;
      }
      if (overdue && task.priority === TaskPriority.HIGH) {
        return 1;
      }
      return 2;
    };
    const rankDifference = rank(a) - rank(b);
    if (rankDifference !== 0) {
      return rankDifference;
    }
    return (
      (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
      (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
    );
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
