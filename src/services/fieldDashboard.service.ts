import { apiRequest } from '../lib/apiClient';
import type {
  FieldDashboard,
  OfficerNotification,
} from '../types/fieldOperations';

export const fieldDashboardService = {
  getDashboard: () =>
    apiRequest<FieldDashboard>('/field/dashboard'),
  getNotifications: () =>
    apiRequest<OfficerNotification[]>(
      '/field/notifications',
    ),
  readNotification: (notificationId: string) =>
    apiRequest<OfficerNotification>(
      `/field/notifications/${notificationId}/read`,
      { method: 'PATCH' },
    ),
  readAllNotifications: () =>
    apiRequest<{ updated: number }>(
      '/field/notifications/read-all',
      { method: 'PATCH' },
    ),
};
