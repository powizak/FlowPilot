import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { UserRole } from '@flowpilot/shared';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(['admin', 'member', 'viewer'])
  role?: UserRole;
}
