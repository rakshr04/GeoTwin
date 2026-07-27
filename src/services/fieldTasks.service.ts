import { apiRequest } from '../lib/apiClient';
import type {
  FieldTask,
  TaskPriority,
  TaskStatus,
} from '../types/fieldOperations';

export interface FieldReportInput {
  reportType: string;
  notes: string;
  changeCategory?: string;
  latitude?: number;
  longitude?: number;
  payload?: Record<string, unknown>;
}

export interface EvidenceInput {
  evidenceType: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}

export const fieldTasksService = {
  list: (filters?: {
    status?: TaskStatus;
    assignmentId?: string;
    due?: 'today';
    priority?: TaskPriority;
  }) => {
    const query = new URLSearchParams(
      Object.entries(filters ?? {}).filter(
        (entry): entry is [string, string] =>
          Boolean(entry[1]),
      ),
    );
    return apiRequest<FieldTask[]>(
      `/field/tasks${query.size ? `?${query}` : ''}`,
    );
  },
  get: (taskId: string) =>
    apiRequest<FieldTask>(`/field/tasks/${taskId}`),
  start: (taskId: string) =>
    apiRequest<FieldTask>(
      `/field/tasks/${taskId}/start`,
      { method: 'PATCH' },
    ),
  report: (taskId: string, input: FieldReportInput) =>
    apiRequest(`/field/tasks/${taskId}/reports`, {
      method: 'POST',
      body: input,
    }),
  submitEvidence: (taskId: string, input: EvidenceInput) =>
    apiRequest(`/field/tasks/${taskId}/evidence`, {
      method: 'POST',
      body: input,
    }),
};
