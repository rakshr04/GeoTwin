import type { AssignedSector, FieldTask } from '../types/fieldOperations';

export interface GeoTwinPlot {
  id: string;
  name: string;
  sector: string;
  longitude: number;
  latitude: number;
  status: 'in_progress' | 'pending' | 'overdue' | 'completed';
  areaHectares: number;
  degradationLevel: 'low' | 'moderate' | 'high';
  progress: number;
  taskTitle: string;
  evidenceUploaded: number;
  evidenceRequired: number;
  dueDate?: string;
  assignedOfficer?: string;
}

export function getStatusColour(status: string): string {
  switch (status.toLowerCase()) {
    case 'in_progress':
    case 'in-progress':
    case 'accepted':
    case 'assigned':
      return '#9BBE55';
    case 'pending':
      return '#D99A2B';
    case 'overdue':
      return '#C95B4A';
    case 'completed':
    case 'submitted':
      return '#4C91CF';
    default:
      return '#9BBE55';
  }
}

export function getStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'ASSIGNED':
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'PENDING':
      return 'Pending';
    case 'OVERDUE':
      return 'Overdue';
    case 'COMPLETED':
    case 'SUBMITTED':
      return 'Completed';
    default:
      return status;
  }
}

export function mapSectorToPlot(sector: AssignedSector, tasks: FieldTask[]): GeoTwinPlot {
  const sectorTasks = tasks.filter((t) => t.assignmentId === sector.assignmentId);
  const currentTask = sectorTasks.find((t) => t.status !== 'COMPLETED') || sectorTasks[0];

  const overdue = sectorTasks.some(
    (t) => t.status !== 'COMPLETED' && t.dueAt && new Date(t.dueAt) < new Date()
  );

  let status: 'in_progress' | 'pending' | 'overdue' | 'completed' = 'in_progress';
  if (sector.assignmentStatus === 'COMPLETED') {
    status = 'completed';
  } else if (overdue) {
    status = 'overdue';
  } else if (sector.assignmentStatus === 'ASSIGNED') {
    status = 'pending';
  }

  const evidenceRequiredCount = sectorTasks.filter((t) => t.requiresEvidence).length;
  const evidenceUploadedCount = sectorTasks.filter(
    (t) => t.requiresEvidence && t.status === 'COMPLETED'
  ).length;

  return {
    id: sector.id,
    name: sector.name,
    sector: sector.projectName,
    longitude: sector.centroid?.coordinates[0] ?? 78.4867,
    latitude: sector.centroid?.coordinates[1] ?? 17.385,
    status,
    areaHectares: sector.areaHectares,
    degradationLevel: sector.areaHectares > 10 ? 'high' : sector.areaHectares > 5 ? 'moderate' : 'low',
    progress: sector.progress,
    taskTitle: currentTask?.title ?? 'No active task',
    evidenceUploaded: evidenceUploadedCount,
    evidenceRequired: evidenceRequiredCount,
    dueDate: sector.dueDate ?? undefined,
    assignedOfficer: undefined,
  };
}

export function mapTaskToMarker(task: FieldTask, sector: AssignedSector | undefined) {
  return {
    id: task.id,
    name: task.title,
    longitude: sector?.centroid?.coordinates[0] ?? 78.4867,
    latitude: sector?.centroid?.coordinates[1] ?? 17.385,
    status: task.status,
  };
}

export function mapPlotToFeature(plot: GeoTwinPlot, geometry: any) {
  return {
    type: 'Feature' as const,
    geometry: geometry,
    properties: {
      id: plot.id,
      name: plot.name,
      sector: plot.sector,
      status: plot.status,
      areaHectares: plot.areaHectares,
      degradationLevel: plot.degradationLevel,
      progress: plot.progress,
      taskTitle: plot.taskTitle,
    },
  };
}
