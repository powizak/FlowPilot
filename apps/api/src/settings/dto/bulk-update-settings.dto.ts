import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SettingUpdateItem {
  @IsDefined()
  @IsString()
  key!: string;

  @IsDefined()
  @IsString()
  @MaxLength(10000)
  value!: string;
}

export class BulkUpdateSettingsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SettingUpdateItem)
  settings!: SettingUpdateItem[];
}
