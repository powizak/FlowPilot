import { IsString, IsOptional, IsBoolean, Matches, MaxLength, MinLength } from 'class-validator';

const IBAN_REGEX = /^[A-Z]{2}[A-Z0-9]{13,32}$/;

export class CreateBankAccountDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  accountNumber!: string;

  @IsString()
  @IsOptional()
  @MinLength(15)
  @MaxLength(34)
  @Matches(IBAN_REGEX, { message: 'IBAN must be alphanumeric and start with 2 letters (15-34 chars total)' })
  iban?: string;

  @IsString()
  @IsOptional()
  swift?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
