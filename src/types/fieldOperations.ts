export type ApplicationRole =
  | 'SUPERVISOR'
  | 'FIELD_OFFICER'
  | 'SYSTEM_ADMINISTRATOR'
  | 'STATE_PROGRAMME_OFFICER'
  | 'DISTRICT_RESTORATION_OFFICER'
  | 'TECHNICAL_RESTORATION_OFFICER'
  | 'FIELD_VERIFICATION_OFFICER';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type PolygonGeometry =
  | {
      type: 'Polygon';
      coordinates: number[][][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: number[][][][];
    };

export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface FieldTask {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  requiresEvidence: boolean;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
  assignmentStatus: AssignmentStatus | null;
}

export interface AssignedSector {
  id: string;
  assignmentId: string;
  projectId: string;
  projectName: string;
  name: string;
  villageName: string | null;
  mandalName: string | null;
  districtName: string | null;
  areaHectares: number;
  geometry: PolygonGeometry;
  centroid: PointGeometry | null;
  assignmentStatus: AssignmentStatus;
  dueDate: string | null;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

export interface WorkflowStage {
  name: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  completedTasks?: number;
  totalTasks?: number;
}

export interface CriticalAlert {
  id: string;
  type: string;
  severity: 'HIGH' | 'CRITICAL';
  message: string;
  taskId?: string;
  assignmentId: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  assignmentId: string | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface FieldDashboard {
  officer: {
    id: string;
    displayName: string;
    role: ApplicationRole;
    districtName: string | null;
  };
  priorityAction: FieldTask | null;
  todayOperations: FieldTask[];
  assignedSectors: AssignedSector[];
  workflow: {
    assignmentId: string | null;
    stages: WorkflowStage[];
  };
  criticalAlerts: CriticalAlert[];
  recentActivity: ActivityItem[];
  notificationCount: number;
  summary: {
    activeAssignments: number;
    pendingTasks: number;
    overdueTasks: number;
    completedTasks: number;
  };
}

export interface RestorationProject {
  id: string;
  name: string;
  description: string | null;
  districtId: string | null;
  status: string;
}

export interface LandSector {
  id: string;
  projectId: string;
  name: string;
  villageName: string | null;
  mandalName: string | null;
  districtName: string | null;
  areaHectares: number;
  geometry: PolygonGeometry;
  centroid: PointGeometry | null;
  status: string;
}

export interface FieldAssignment {
  id: string;
  projectId: string;
  sectorId: string | null;
  assignedToProfileId: string;
  assignedByProfileId: string;
  assignmentType: string;
  status: AssignmentStatus;
  startDate: string | null;
  dueDate: string | null;
  instructions: string | null;
  createdAt: string;
  project: RestorationProject | null;
  sector: LandSector | null;
  tasks: FieldTask[];
}

export interface OfficerNotification {
  id: string;
  recipientProfileId: string;
  title: string;
  message: string;
  type: string;
  deepLink: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface FieldOfficerOption {
  id: string;
  displayName: string;
  email: string | null;
  role: ApplicationRole;
  districtId: string | null;
  active: boolean;
}

export interface AssignmentTaskInput {
  title: string;
  description?: string;
  taskType: string;
  priority: TaskPriority;
  dueAt?: string;
  requiresEvidence: boolean;
}

export interface CreateAssignmentInput {
  projectId: string;
  sectorId?: string;
  assignedToProfileId: string;
  assignmentType: string;
  startDate?: string;
  dueDate?: string;
  instructions?: string;
  tasks: AssignmentTaskInput[];
}
