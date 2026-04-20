import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AttachmentsService } from './attachments.service.js';

@Controller('api')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.upload(taskId, file, user);
  }

  @Get('tasks/:taskId/attachments')
  list(@Param('taskId') taskId: string) {
    return this.attachmentsService.listByTask(taskId);
  }

  @Get('attachments/:id/url')
  getUrl(@Param('id') id: string) {
    return this.attachmentsService.getPresignedUrl(id);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(id);
  }
}
