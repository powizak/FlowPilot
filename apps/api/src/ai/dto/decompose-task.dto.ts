import { IsString } from 'class-validator';

export class DecomposeTaskDto {
  @IsString()
  taskId!: string;
}
