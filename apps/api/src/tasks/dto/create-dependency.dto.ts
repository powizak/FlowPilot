import { IsIn, IsUUID } from 'class-validator';

export class CreateDependencyDto {
  @IsUUID()
  dependencyTaskId!: string;

  @IsIn(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH'])
  type!: string;
}
