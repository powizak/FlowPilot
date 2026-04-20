import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsIn(['none', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsUUID()
  reporterId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedHours?: number | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsBoolean()
  trackTime?: boolean;

  @IsOptional()
  @IsIn(['hourly', 'fixed', 'retainer'])
  billingType?: string | null;

  @IsOptional()
  @IsUUID()
  workTypeId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  labels?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
