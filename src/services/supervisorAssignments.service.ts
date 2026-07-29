import { apiRequest } from '../lib/apiClient';
import type {
  CreateAssignmentInput,
  FieldAssignment,
  FieldOfficerOption,
  LandSector,
  RestorationProject,
} from '../types/fieldOperations';

export const supervisorAssignmentsService = {
  getFieldOfficers: () =>
    apiRequest<FieldOfficerOption[]>(
      '/supervisor/field-officers',
    ),
  getProjects: () =>
    apiRequest<RestorationProject[]>(
      '/supervisor/projects',
    ),
  createProject: (input: {
    name: string;
    description?: string;
  }) =>
    apiRequest<RestorationProject>('/supervisor/projects', {
      method: 'POST',
      body: input,
    }),
  getSectors: (projectId: string) =>
    apiRequest<LandSector[]>(
      `/supervisor/projects/${projectId}/sectors`,
    ),
  createAssignment: (input: CreateAssignmentInput) =>
    apiRequest<{
      assignment: FieldAssignment;
      tasks: FieldAssignment['tasks'];
    }>('/supervisor/assignments', {
      method: 'POST',
      body: input,
    }),
  getAssignments: () =>
    apiRequest<FieldAssignment[]>(
      '/supervisor/assignments',
    ),
};
