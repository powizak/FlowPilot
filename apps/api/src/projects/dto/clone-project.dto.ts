import { IsString } from 'class-validator';

export class CloneProjectDto {
  @IsString()
  name!: string;
}
