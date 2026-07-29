import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AssignedLandMap } from '../src/components/map/AssignedLandMap';
import ReportChangePage from '../src/pages/ReportChangePage';
import { fieldTasksService } from '../src/services/fieldTasks.service';

vi.mock('../src/services/fieldTasks.service', () => ({
  fieldTasksService: {
    list: vi.fn(),
    report: vi.fn(),
  },
}));

vi.mock('../src/utils/auth', () => ({
  logoutUser: vi.fn(),
}));

describe('map and report states', () => {
  it('does not crash when the Mapbox token is missing', () => {
    render(
      <AssignedLandMap
        sectors={[
          {
            id: 'sector-1',
            assignmentId: 'assignment-1',
            projectId: 'project-1',
            projectName: 'Demo project',
            name: 'Demo sector',
            villageName: null,
            mandalName: null,
            districtName: 'Vikarabad',
            areaHectares: 12.4,
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [77.82, 17.3],
                  [77.83, 17.3],
                  [77.83, 17.31],
                  [77.82, 17.3],
                ],
              ],
            },
            centroid: null,
            assignmentStatus: 'ASSIGNED',
            dueDate: null,
            progress: 0,
            completedTasks: 0,
            totalTasks: 1,
          },
        ]}
      />,
    );
    expect(
      screen.getByText('Map configuration required'),
    ).toBeInTheDocument();
  });

  it('validates a field-change report before sending it', async () => {
    vi.mocked(fieldTasksService.list).mockResolvedValue([
      {
        id: 'task-1',
        assignmentId: 'assignment-1',
        title: 'Inspect sector',
        description: null,
        taskType: 'FIELD_VERIFICATION',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueAt: null,
        requiresEvidence: false,
        createdAt: '2026-07-27T00:00:00.000Z',
        projectId: 'project-1',
        projectName: 'Demo project',
        assignmentStatus: 'IN_PROGRESS',
      },
    ]);
    render(
      <MemoryRouter>
        <ReportChangePage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/inspect sector/i),
      ).toBeInTheDocument(),
    );
    fireEvent.change(
      screen.getByRole('combobox', {
        name: /assigned task/i,
      }),
      { target: { value: 'task-1' } },
    );
    fireEvent.change(
      screen.getByRole('textbox', {
        name: /observed change/i,
      }),
      { target: { value: 'ab' } },
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /submit report/i,
      }),
    );
    expect(
      await screen.findByText('Describe the field change.'),
    ).toBeInTheDocument();
    expect(fieldTasksService.report).not.toHaveBeenCalled();
  });
});
