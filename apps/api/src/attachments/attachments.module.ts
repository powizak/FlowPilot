import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller.js';
import { AttachmentsService } from './attachments.service.js';
import { MinioService } from './minio.service.js';

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, MinioService],
  exports: [MinioService],
})
export class AttachmentsModule {}
