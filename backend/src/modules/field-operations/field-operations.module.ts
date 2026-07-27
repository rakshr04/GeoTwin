import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AuditEvent,
  EvidenceItem,
  FieldReport,
  FieldTask,
  LandSector,
  Notification,
  OfficerAssignment,
  OfficerProfile,
  Region,
  RestorationProject,
} from '../../entities';
import {
  FieldOperationsController,
  SupervisorOperationsController,
} from './field-operations.controller';
import { FieldOperationsService } from './field-operations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfficerProfile,
      Region,
      RestorationProject,
      LandSector,
      OfficerAssignment,
      FieldTask,
      FieldReport,
      EvidenceItem,
      Notification,
      AuditEvent,
    ]),
  ],
  controllers: [
    FieldOperationsController,
    SupervisorOperationsController,
  ],
  providers: [FieldOperationsService],
  exports: [FieldOperationsService],
})
export class FieldOperationsModule {}
