import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderTaskItemDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderTaskItemDto)
  items!: ReorderTaskItemDto[];
}
