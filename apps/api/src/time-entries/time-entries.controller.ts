import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto.js';
import { ListTimeEntriesQueryDto } from './dto/list-time-entries-query.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { StartTimerDto } from './dto/start-timer.dto.js';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto.js';
import { TimeEntriesService } from './time-entries.service.js';

@Controller('api/time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get()
  list(@Query() query: ListTimeEntriesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.list(query, user);
  }

  @Post()
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.create(dto, user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimeEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.remove(id, user);
  }

  @Post('start')
  start(@Body() dto: StartTimerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.start(dto, user);
  }

  @Post('stop')
  stop(@CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.stop(user);
  }

  @Get('running')
  running(@CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.running(user);
  }

  @Get('report')
  report(@Query() query: ReportQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.timeEntriesService.report(query, user);
  }
}
