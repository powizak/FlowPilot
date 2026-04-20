import { ValidateIf, IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  taskId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  workTypeId?: string | null;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;
}
