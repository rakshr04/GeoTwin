import 'dotenv/config';

import { AppDataSource } from '../database';
import {
  AssignmentStatus,
  OfficerRole,
  TaskPriority,
  TaskStatus,
} from '../common';
import {
  AuditEvent,
  FieldTask,
  LandSector,
  Notification,
  OfficerAssignment,
  OfficerProfile,
  RestorationProject,
} from '../entities';

async function seedDemoAssignment() {
  await AppDataSource.initialize();
  const profiles =
    AppDataSource.getRepository(OfficerProfile);
  const supervisor = await profiles.findOne({
    where: [
      {
        authUserId:
          process.env.DEMO_SUPERVISOR_AUTH_USER_ID,
        active: true,
      },
      {
        role: OfficerRole.DISTRICT_RESTORATION_OFFICER,
        active: true,
      },
    ],
  });
  const fieldOfficer = await profiles.findOne({
    where: [
      {
        authUserId: process.env.DEMO_FIELD_AUTH_USER_ID,
        active: true,
      },
      {
        role: OfficerRole.FIELD_VERIFICATION_OFFICER,
        active: true,
      },
    ],
  });
  if (!supervisor || !fieldOfficer) {
    throw new Error(
      'Run npm run seed:profiles first, or provide existing active supervisor and field officer profiles.',
    );
  }

  const result = await AppDataSource.transaction(
    async (manager) => {
      let project = await manager.findOne(
        RestorationProject,
        {
          where: {
            name: 'Ananthagiri Ridge Restoration Demo',
          },
        },
      );
      project ??= await manager.save(
        RestorationProject,
        manager.create(RestorationProject, {
          name: 'Ananthagiri Ridge Restoration Demo',
          description:
            'Controlled GeoTwin demo project. Coordinates are illustrative and are not live government data.',
          districtId:
            supervisor.districtId ??
            fieldOfficer.districtId,
          status: 'ACTIVE',
          createdByProfileId: supervisor.id,
        }),
      );

      let sector = await manager.findOne(LandSector, {
        where: {
          projectId: project.id,
          name: 'Ananthagiri Demo Sector A',
        },
      });
      sector ??= await manager.save(
        LandSector,
        manager.create(LandSector, {
          projectId: project.id,
          name: 'Ananthagiri Demo Sector A',
          villageName: 'Kotepally',
          mandalName: 'Vikarabad',
          districtName: 'Vikarabad',
          areaHectares: 38.42,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [77.8262, 17.3121],
                [77.8358, 17.3134],
                [77.8371, 17.3061],
                [77.8293, 17.3027],
                [77.8248, 17.3068],
                [77.8262, 17.3121],
              ],
            ],
          },
          centroid: {
            type: 'Point',
            coordinates: [77.831, 17.3084],
          },
          status: 'ACTIVE',
        }),
      );

      let assignment = await manager.findOne(
        OfficerAssignment,
        {
          where: {
            projectId: project.id,
            sectorId: sector.id,
            assignedToProfileId: fieldOfficer.id,
            assignmentType: 'DEMO_FIELD_MISSION',
          },
        },
      );
      if (assignment) {
        return {
          project,
          sector,
          assignment,
          created: false,
        };
      }

      const today = new Date();
      const dueDate = new Date(
        today.getTime() + 7 * 86_400_000,
      );
      assignment = await manager.save(
        OfficerAssignment,
        manager.create(OfficerAssignment, {
          projectId: project.id,
          sectorId: sector.id,
          assignedToProfileId: fieldOfficer.id,
          assignedByProfileId: supervisor.id,
          assignmentType: 'DEMO_FIELD_MISSION',
          status: AssignmentStatus.ASSIGNED,
          startDate: today.toISOString().slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          instructions:
            'Inspect the assigned boundary, record erosion indicators, and submit only the evidence requested by each task.',
        }),
      );
      await manager.save(
        FieldTask,
        [
          {
            title: 'Boundary and access verification',
            description:
              'Confirm safe access and compare visible boundary markers with the assigned polygon.',
            taskType: 'FIELD_VERIFICATION',
            priority: TaskPriority.HIGH,
            dueAt: new Date(
              today.getTime() + 86_400_000,
            ),
            requiresEvidence: true,
          },
          {
            title: 'Erosion condition assessment',
            description:
              'Record rill, gully, and runoff indicators within the assigned sector.',
            taskType: 'EVIDENCE_COLLECTION',
            priority: TaskPriority.CRITICAL,
            dueAt: new Date(
              today.getTime() + 2 * 86_400_000,
            ),
            requiresEvidence: true,
          },
          {
            title: 'Community access note',
            description:
              'Document any access constraints reported at the site.',
            taskType: 'FIELD_REPORT',
            priority: TaskPriority.MEDIUM,
            dueAt: dueDate,
            requiresEvidence: false,
          },
        ].map((task) =>
          manager.create(FieldTask, {
            ...task,
            assignmentId: assignment.id,
            status: TaskStatus.PENDING,
            createdByProfileId: supervisor.id,
            assignedToProfileId: fieldOfficer.id,
          }),
        ),
      );
      await manager.save(
        Notification,
        manager.create(Notification, {
          recipientProfileId: fieldOfficer.id,
          type: 'ASSIGNMENT_CREATED',
          title: 'Demo field assignment issued',
          message: `${project.name} — ${sector.name}`,
          deepLink: `/field/assignments/${assignment.id}`,
        }),
      );
      await manager.save(
        AuditEvent,
        manager.create(AuditEvent, {
          actorProfileId: supervisor.id,
          actorRole: supervisor.role,
          action: 'DEMO_FIELD_ASSIGNMENT_CREATED',
          targetType: 'OfficerAssignment',
          targetId: assignment.id,
          assignmentId: assignment.id,
          metadata: {
            demoData: true,
            message:
              'Controlled demo assignment issued. Not live government data.',
          },
        }),
      );
      return { project, sector, assignment, created: true };
    },
  );

  console.log(
    result.created
      ? `Demo assignment created: ${result.assignment.id}`
      : `Demo assignment already exists: ${result.assignment.id}`,
  );
}

seedDemoAssignment()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
