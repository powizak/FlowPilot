import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { SettingsService } from './settings.service.js';
import { UpdateSettingDto } from './dto/update-setting.dto.js';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN' as UserRole)
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Put(':key')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto.value);
  }

  @Put('bulk')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings);
  }
}