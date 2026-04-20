import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AutomationsService } from './automations.service.js';

@Controller('api')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('projects/:projectId/automations')
  list(
    @Param('projectId') projectId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.automationsService.listByProject(projectId, request.user);
  }

  @Post('projects/:projectId/automations')
  create(
    @Param('projectId') projectId: string,
    @Body()
    dto: {
      name: string;
      trigger: Record<string, unknown>;
      actions: Record<string, unknown>[];
      isActive?: boolean;
    },
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.automationsService.create(projectId, dto, request.user);
  }

  @Put('automations/:id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      trigger?: Record<string, unknown>;
      actions?: Record<string, unknown>[];
    },
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.automationsService.update(id, dto, request.user);
  }

  @Delete('automations/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.automationsService.remove(id, request.user);
  }

  @Put('automations/:id/toggle')
  toggle(@Param('id') id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.automationsService.toggle(id, request.user);
  }
}
