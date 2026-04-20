import { IsIn, IsUUID } from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  userId!: string;

  @IsIn(['owner', 'member', 'viewer'])
  role!: string;
}
