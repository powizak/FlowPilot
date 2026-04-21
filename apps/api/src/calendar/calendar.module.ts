import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service.js';
import { CalendarController } from './calendar.controller.js';

@Module({
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
