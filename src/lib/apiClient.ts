import { supabase } from './supabase';

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = (
  configuredBaseUrl || 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

interface ApiEnvelope<T> {
  data: T;
  requestId: string;
  timestamp: string;
  warnings: string[];
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Array<{ message: string }>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: string[];

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    fieldErrors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

import type { OfficerNotification } from '../types/fieldOperations';

let mockNotifications: OfficerNotification[] = [
  {
    id: 'notif-1',
    recipientProfileId: 'mock-officer-id',
    title: 'New Assignment',
    message: 'You have been assigned to Salar Jung Forest Survey.',
    type: 'ASSIGNMENT',
    deepLink: '/field/assignments',
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    recipientProfileId: 'mock-officer-id',
    title: 'Task Overdue',
    message: 'Conduct ground survey at Plot C-12 is overdue.',
    type: 'ALERT',
    deepLink: '/field/tasks',
    readAt: null,
    createdAt: new Date().toISOString(),
  },
];

// Offline Mock Data Generator for Hackathon
function getMockData(path: string): any {
  if (path.includes('/supervisor/field-officers')) {
    return [
      { id: 'officer-1', displayName: 'Ramesh Kumar', role: 'FIELD_OFFICER', districtName: 'Hyderabad', email: 'ramesh@geotwin.in' },
      { id: 'officer-2', displayName: 'Priya Sharma', role: 'FIELD_OFFICER', districtName: 'Rangareddy', email: 'priya@geotwin.in' }
    ];
  }
  if (path.includes('/supervisor/projects')) {
    return [
      { id: 'proj-1', name: 'Salar Jung Forest Survey', description: 'Restoration survey of Salar Jung woodland area.', status: 'ACTIVE' },
      { id: 'proj-2', name: 'Urban Green Cover Program', description: 'Monitoring urban tree canopy expansion.', status: 'ACTIVE' }
    ];
  }
  if (path.includes('/supervisor/assignments') || path.includes('/field/assignments')) {
    return [
      {
        id: 'assign-1',
        projectId: 'proj-1',
        sectorId: 'sector-2',
        assignedToProfileId: 'officer-1',
        assignedByProfileId: 'supervisor-rakshitha-id',
        assignmentType: 'FIELD_MISSION',
        status: 'IN_PROGRESS',
        dueDate: '2026-08-15',
        instructions: 'Inspect canopy density and submit report.',
        tasks: [
          {
            id: 'task-1',
            assignmentId: 'assign-1',
            title: 'Conduct ground survey at Plot C-12',
            description: 'Verify tree counts and photograph boundary line',
            taskType: 'FIELD_VERIFICATION',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            dueAt: '2026-08-15T17:00:00.000Z',
            requiresEvidence: true,
            createdByProfileId: 'supervisor-rakshitha-id',
            assignedToProfileId: 'officer-1',
          }
        ]
      }
    ];
  }
  if (path.includes('/sectors')) {
    return [
      {
        id: 'sector-1',
        projectId: 'proj-2',
        name: 'Sector 3 Canopy Area',
        villageName: 'Gachibowli',
        mandalName: 'Serilingampally',
        districtName: 'Rangareddy',
        areaHectares: 120.5,
        geometry: {
          type: 'Polygon',
          coordinates: [[[78.34, 17.44], [78.36, 17.44], [78.36, 17.46], [78.34, 17.46], [78.34, 17.44]]]
        },
        centroid: { type: 'Point', coordinates: [78.35, 17.45] },
        status: 'ACTIVE'
      },
      {
        id: 'sector-2',
        projectId: 'proj-1',
        name: 'Plot C-12 Plantation',
        villageName: 'Charminar',
        mandalName: 'Hyderabad',
        districtName: 'Hyderabad',
        areaHectares: 85.2,
        geometry: {
          type: 'Polygon',
          coordinates: [[[78.47, 17.35], [78.49, 17.35], [78.49, 17.37], [78.47, 17.37], [78.47, 17.35]]]
        },
        centroid: { type: 'Point', coordinates: [78.48, 17.36] },
        status: 'ACTIVE'
      }
    ];
  }

  const unreadCount = mockNotifications.filter((n) => !n.readAt).length;
  if (path.includes('/field/dashboard')) {
    return {
      officer: {
        id: 'mock-officer-id',
        displayName: 'Demo Field Officer',
        role: 'FIELD_OFFICER',
        districtName: 'Demo District',
      },
      notificationCount: unreadCount,
      summary: {
        activeAssignments: 2,
        pendingTasks: 4,
        overdueTasks: 1,
        completedTasks: 8,
      },
      priorityAction: {
        id: 'task-1',
        title: 'Conduct ground survey at Plot C-12',
        projectName: 'Salar Jung Forest Survey',
        priority: 'CRITICAL',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      },
      todayOperations: [
        {
          id: 'task-1',
          title: 'Conduct ground survey at Plot C-12',
          projectName: 'Salar Jung Forest Survey',
          priority: 'CRITICAL',
          dueAt: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: 'task-2',
          title: 'Verify canopy covers at Sector 3',
          projectName: 'Urban Green Cover Program',
          priority: 'HIGH',
          dueAt: new Date(Date.now() + 172800000).toISOString(),
        }
      ],
      assignedSectors: [
        {
          id: 'sector-1',
          name: 'Sector 3 Canopy Area',
          projectName: 'Urban Green Cover Program',
          areaHectares: 120.5,
          progress: 65,
        },
        {
          id: 'sector-2',
          name: 'Plot C-12 Plantation',
          projectName: 'Salar Jung Forest Survey',
          areaHectares: 85.2,
          progress: 20,
        }
      ],
      workflow: {
        stages: [
          { name: 'Initial Survey', status: 'COMPLETED', completedTasks: 4, totalTasks: 4 },
          { name: 'On-ground Verification', status: 'IN_PROGRESS', completedTasks: 1, totalTasks: 3 },
          { name: 'Audit Approval', status: 'PENDING' }
        ]
      },
      criticalAlerts: [
        {
          id: 'alert-1',
          message: 'Canopy density drop detected in Sector 3!',
          taskId: 'task-2',
        }
      ],
      recentActivity: [
        {
          id: 'act-1',
          message: 'Uploaded evidence logs for Plot C-12',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'act-2',
          message: 'Checked in to Sector 3 boundary line',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        }
      ]
    };
  }
  if (path.includes('/read-all')) {
    mockNotifications = mockNotifications.map(n => ({ ...n, readAt: new Date().toISOString() }));
    return { updated: mockNotifications.length };
  }
  if (path.includes('/read')) {
    mockNotifications = mockNotifications.map(n => path.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n);
    return mockNotifications[0];
  }
  if (path.includes('/field/notifications')) {
    return mockNotifications;
  }
  if (path.includes('/tasks')) {
    return [];
  }
  return [];
}


export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  // If we are logged in using mock credentials, bypass live requests to backend
  const hasMockSession = localStorage.getItem('gt_auth_user') !== null;
  if (hasMockSession) {
    return Promise.resolve(getMockData(path) as T);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ApiError(
      'Your session has expired. Please sign in again.',
      401,
      'UNAUTHENTICATED',
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  );
  try {
    const response = await fetch(
      `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`,
      {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers,
        },
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body),
      },
    );
    const payload = (await response
      .json()
      .catch(() => ({}))) as
      | ApiEnvelope<T>
      | ApiErrorEnvelope;
    if (!response.ok) {
      const errorPayload = payload as ApiErrorEnvelope;
      if (response.status === 401) {
        await supabase.auth.signOut();
      }
      throw new ApiError(
        errorPayload.error?.message ??
          `Request failed with status ${response.status}.`,
        response.status,
        errorPayload.error?.code,
        errorPayload.error?.fieldErrors?.map(
          (item) => item.message,
        ) ?? [],
      );
    }
    return (payload as ApiEnvelope<T>).data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new ApiError(
        'The request timed out. Please try again.',
        408,
        'REQUEST_TIMEOUT',
      );
    }
    throw new ApiError(
      'The GeoTwin service could not be reached.',
      0,
      'NETWORK_ERROR',
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

