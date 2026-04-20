import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CloneProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
