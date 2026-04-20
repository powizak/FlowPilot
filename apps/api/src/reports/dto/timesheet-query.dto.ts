import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class TimesheetQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv';
}
