import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarSyncService } from './calendar-sync.service.js';
import { CalendarSyncController } from './calendar-sync.controller.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CalendarSyncService],
  controllers: [CalendarSyncController],
})
export class CalendarSyncModule {}
