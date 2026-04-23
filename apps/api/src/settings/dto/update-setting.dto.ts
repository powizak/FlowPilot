import { IsDefined, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @IsDefined()
  @IsString()
  @MaxLength(10000)
  value!: string;
}
