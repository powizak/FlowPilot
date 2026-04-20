import {
  Controller,
  Get,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CalendarService } from './calendar.service.js';

@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('ical')
  @Public()
  async getICal(
    @Query('token') token: string,
    @Res() res: any,
  ) {
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await this.calendarService.findUserByCalendarToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const icalContent = await this.calendarService.generateICal(user.id);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="flowpilot.ics"');
    res.send(icalContent);
  }

  @Get('ical-token')
  getICalToken(@Req() req: { user: AuthenticatedUser }) {
    return this.calendarService.getOrCreateCalendarToken(req.user.id);
  }
}