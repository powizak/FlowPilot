import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListProjectsQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsIn(['active', 'archived', 'on_hold'])
  status?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}
