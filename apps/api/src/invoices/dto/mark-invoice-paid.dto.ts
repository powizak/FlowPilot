import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class MarkInvoicePaidDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPaid!: number;
}
