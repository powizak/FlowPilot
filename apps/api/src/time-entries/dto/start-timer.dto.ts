import { ValidateIf, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartTimerDto {
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

  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
