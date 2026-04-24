import { Transform } from 'class-transformer';
import { IsDefined, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @Transform(({ value }) => String(value ?? ''))
  @IsDefined()
  @IsString()
  @MaxLength(10000)
  value!: string;
}
