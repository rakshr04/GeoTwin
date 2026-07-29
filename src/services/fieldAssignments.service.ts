import { apiRequest } from '../lib/apiClient';
import type {
  FieldAssignment,
} from '../types/fieldOperations';

export const fieldAssignmentsService = {
  list: () =>
    apiRequest<FieldAssignment[]>('/field/assignments'),
  get: (assignmentId: string) =>
    apiRequest<FieldAssignment>(
      `/field/assignments/${assignmentId}`,
    ),
  accept: (assignmentId: string) =>
    apiRequest<FieldAssignment>(
      `/field/assignments/${assignmentId}/accept`,
      { method: 'PATCH' },
    ),
};
