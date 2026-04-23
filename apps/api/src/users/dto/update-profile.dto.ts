import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false, require_protocol: true })
  @MaxLength(500)
  avatarUrl?: string | null;
}
