import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkTypeDto {
  @IsString()
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'hourlyRate must be greater than 0' })
  @Type(() => Number)
  hourlyRate!: number;

  @IsString()
  color!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}