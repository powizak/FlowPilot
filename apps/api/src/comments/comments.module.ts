import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';

@Module({
  imports: [ActivityModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
