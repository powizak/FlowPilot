import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListTasksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsIn(['none', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsIn(['position', 'createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'])
  sortBy?: string = 'position';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'asc';
}
