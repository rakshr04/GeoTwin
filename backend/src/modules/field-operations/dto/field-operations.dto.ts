import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  ValidateNested,
  IsNumber,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '../../../common';

export class CreateProjectDto {
  @IsString()
  @Length(3, 160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  districtId?: string;
}

export class CreateSectorDto {
  @IsString()
  @Length(2, 160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  villageName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  mandalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  districtName?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  areaHectares: number;

  @IsObject()
  geometry: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  centroid?: Record<string, unknown>;
}

export class AssignmentTaskDto {
  @IsString()
  @Length(3, 180)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsString()
  @Length(2, 80)
  taskType: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsBoolean()
  requiresEvidence: boolean;
}

export class CreateAssignmentDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @IsUUID()
  assignedToProfileId: string;

  @IsString()
  @Length(2, 80)
  assignmentType: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instructions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssignmentTaskDto)
  tasks: AssignmentTaskDto[];
}

export class AddAssignmentTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssignmentTaskDto)
  tasks: AssignmentTaskDto[];
}

export class FieldTaskFiltersDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsString()
  due?: 'today';

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}

export class CreateFieldReportDto {
  @IsString()
  @Length(2, 80)
  reportType: string;

  @IsString()
  @Length(3, 4000)
  notes: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  changeCategory?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class CreateEvidenceDto {
  @IsString()
  @Length(2, 80)
  evidenceType: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsDateString()
  capturedAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
