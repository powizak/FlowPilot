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
  Query,
  Req,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { ActivityService } from '../activity/activity.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AddProjectMemberDto } from './dto/add-project-member.dto.js';
import { CloneProjectDto } from './dto/clone-project.dto.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly activityService: ActivityService,
  ) {}

  @Get()
  list(
    @Query() query: ListProjectsQueryDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.list(query, request.user);
  }

  @Post()
  @Roles('admin' as UserRole, 'member' as UserRole)
  create(
    @Body() dto: CreateProjectDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.create(dto, request.user);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.projectsService.stats(id, request.user);
  }

  @Post(':id/clone')
  clone(
    @Param('id') id: string,
    @Body() dto: CloneProjectDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.clone(id, dto, request.user);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.addMember(id, dto, request.user);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.removeMember(id, userId, request.user);
  }

  @Get(':id/assignees')
  listAssignees(
    @Param('id') id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.listAssignees(id, request.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.findOne(id, request.user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.update(id, dto, request.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('id') id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.projectsService.archive(id, request.user);
  }

  @Get(':id/activity')
  listProjectActivity(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.activityService.listByEntity(
      'PROJECT',
      id,
      limit ? parseInt(limit, 10) : undefined,
      cursor || undefined,
    );
  }
}
