import { IsIn } from 'class-validator';

export class MoveTaskDto {
  @IsIn(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'])
  status!: string;
}
