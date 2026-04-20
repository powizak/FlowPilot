import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Sse,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('isRead') isRead?: string,
  ) {
    const readFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationsService.getNotifications(user.id, readFilter);
  }

  @Put('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.markAllRead(user.id);
    return { count };
  }

  @Put(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Sse('stream')
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.notificationsService.streamForUser(user.id);
  }
}
