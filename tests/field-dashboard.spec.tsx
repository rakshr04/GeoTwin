import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPlaceholder from '../src/pages/DashboardPlaceholder';
import { useFieldDashboard } from '../src/hooks/useFieldDashboard';
import type { FieldDashboard } from '../src/types/fieldOperations';

vi.mock('../src/hooks/useFieldDashboard', () => ({
  useFieldDashboard: vi.fn(),
}));

vi.mock('../src/utils/auth', () => ({
  logoutUser: vi.fn(),
}));

const baseDashboard: FieldDashboard = {
  officer: {
    id: 'profile-1',
    displayName: 'Field Officer',
    role: 'FIELD_VERIFICATION_OFFICER',
    districtName: 'Vikarabad',
  },
  priorityAction: null,
  todayOperations: [],
  assignedSectors: [],
  workflow: { assignmentId: null, stages: [] },
  criticalAlerts: [],
  recentActivity: [],
  notificationCount: 0,
  summary: {
    activeAssignments: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
  },
};

function hookResult(
  data: FieldDashboard | null,
  overrides: Record<string, unknown> = {},
) {
  return {
    data,
    loading: false,
    refreshing: false,
    error: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('field dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the authorised empty state without fake operations', () => {
    vi.mocked(useFieldDashboard).mockReturnValue(
      hookResult(baseDashboard),
    );
    render(
      <MemoryRouter>
        <DashboardPlaceholder />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(
        'No field assignments have been issued yet.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Capture Evidence'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Vikarabad Restoration Site'),
    ).not.toBeInTheDocument();
  });

  it('renders assigned operations from the API response', () => {
    const task = {
      id: 'task-1',
      assignmentId: 'assignment-1',
      title: 'Inspect erosion markers',
      description: null,
      taskType: 'FIELD_VERIFICATION',
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      dueAt: '2026-07-27T12:00:00.000Z',
      requiresEvidence: true,
      createdAt: '2026-07-27T08:00:00.000Z',
      projectId: 'project-1',
      projectName: 'Ananthagiri Demo',
      assignmentStatus: 'ASSIGNED' as const,
    };
    vi.mocked(useFieldDashboard).mockReturnValue(
      hookResult({
        ...baseDashboard,
        priorityAction: task,
        todayOperations: [task],
        summary: {
          ...baseDashboard.summary,
          activeAssignments: 1,
          pendingTasks: 1,
        },
      }),
    );
    render(
      <MemoryRouter>
        <DashboardPlaceholder />
      </MemoryRouter>,
    );
    expect(
      screen.getAllByText('Inspect erosion markers').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: /open map/i }),
    ).toHaveAttribute('href', '/field/map');
  });

  it('shows a retry action for API errors', () => {
    vi.mocked(useFieldDashboard).mockReturnValue(
      hookResult(null, {
        error: 'Service unavailable',
      }),
    );
    render(
      <MemoryRouter>
        <DashboardPlaceholder />
      </MemoryRouter>,
    );
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Retry' }),
    ).toBeInTheDocument();
  });
});
