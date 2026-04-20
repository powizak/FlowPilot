import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service.js';
import { CalendarController } from './calendar.controller.js';

@Module({
  providers: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule {}