import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CalendarSyncService } from './calendar-sync.service.js';

@Controller('calendar-sync')
export class CalendarSyncController {
  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Get('auth-url')
  getAuthUrl() {
    if (!this.calendarSyncService.isConfigured()) {
      throw new ServiceUnavailableException('Google Calendar not configured');
    }
    return { url: this.calendarSyncService.getAuthUrl() };
  }

  @Get('callback')
  async callback(
    @CurrentUser() user: AuthenticatedUser,
    @Query('code') code: string,
  ) {
    if (!this.calendarSyncService.isConfigured()) {
      throw new ServiceUnavailableException('Google Calendar not configured');
    }
    await this.calendarSyncService.exchangeCode(user.id, code);
    return { success: true };
  }

  @Get('status')
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.calendarSyncService.getStatus(user.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(@CurrentUser() user: AuthenticatedUser) {
    const synced = await this.calendarSyncService.syncUserTasks(user.id);
    return { synced };
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    await this.calendarSyncService.disconnect(user.id);
    return { success: true };
  }
}
