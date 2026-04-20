import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Prisma } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  ic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  dic?: string;

  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  billingAddress?: Prisma.InputJsonValue;

  @IsOptional()
  deliveryAddress?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultPaymentTermsDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultInvoiceNote?: string;

  @IsOptional()
  @IsBoolean()
  vatSubject?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}
