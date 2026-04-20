import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

const toOptionalWorkTypeIds = ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
  const raw = value ?? obj?.['workTypeIds[]'];
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  const values = (Array.isArray(raw) ? raw : [raw])
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : [item]))
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  return values.length > 0 ? values : undefined;
};

export class InvoiceFromEntriesDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(toOptionalWorkTypeIds)
  @IsArray()
  @IsUUID('4', { each: true })
  workTypeIds?: string[];
}
