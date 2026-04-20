import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class MeetingToTasksDto {
  @IsString()
  @MaxLength(50000)
  text!: string;

  @IsUUID()
  projectId!: string;
}

export class MeetingTaskItem {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsIn(['none', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  deadline?: string;
}

export class ApplyMeetingTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingTaskItem)
  tasks!: MeetingTaskItem[];

  @IsUUID()
  projectId!: string;
}
