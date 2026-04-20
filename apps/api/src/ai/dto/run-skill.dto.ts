import { IsDefined, IsString, MaxLength } from 'class-validator';

export class RunSkillDto {
  @IsString()
  @MaxLength(100)
  skillName!: string;

  @IsDefined()
  input!: unknown;
}
