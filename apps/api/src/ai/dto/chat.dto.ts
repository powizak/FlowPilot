import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class ChatContextDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}

export class ChatDto {
  @IsString()
  message!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChatContextDto)
  context?: ChatContextDto;
}
