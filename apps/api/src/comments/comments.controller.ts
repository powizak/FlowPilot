import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@Controller('api')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  list(@Param('taskId') taskId: string) {
    return this.commentsService.listByTask(taskId);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.commentsService.create(taskId, dto, request.user);
  }

  @Put('comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.commentsService.update(id, dto, request.user);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.commentsService.remove(id, request.user);
  }
}
