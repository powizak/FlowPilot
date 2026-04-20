import { ValidateIf, IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTimeEntryDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  taskId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  workTypeId?: string | null;

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
