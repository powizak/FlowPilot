import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { WorkTypesService } from './work-types.service.js';
import { CreateWorkTypeDto } from './dto/create-work-type.dto.js';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('api/work-types')
export class WorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const includeAll = includeInactive === 'true';
    return this.workTypesService.findAll(includeAll);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workTypesService.findOne(id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateWorkTypeDto) {
    return this.workTypesService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateWorkTypeDto) {
    return this.workTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.workTypesService.softDelete(id);
  }
}
