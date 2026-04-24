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
import { ActivityService } from '../activity/activity.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { TasksDependenciesService } from './tasks-dependencies.service.js';
import { TasksService } from './tasks.service.js';
import { TasksSubtasksService } from './tasks-subtasks.service.js';
import { CreateDependencyDto } from './dto/create-dependency.dto.js';
import { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { ReorderTasksDto } from './dto/reorder-tasks.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Controller('api')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly subtasksService: TasksSubtasksService,
    private readonly dependenciesService: TasksDependenciesService,
    private readonly activityService: ActivityService,
  ) {}

  @Get('projects/:projectId/tasks')
  listProjectTasks(
    @Param('projectId') projectId: string,
    @Query() query: ListTasksQueryDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.listProjectTasks(projectId, query, request.user);
  }

  @Post('projects/:projectId/tasks')
  createProjectTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.create(projectId, dto, request.user);
  }

  @Get('tasks')
  listAccessibleTasks(
    @Query() query: ListTasksQueryDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.listAccessibleTasks(query, request.user);
  }

  @Get('tasks/my')
  listMyTasks(
    @Query() query: ListTasksQueryDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.listMyTasks(query, request.user);
  }

  @Put('tasks/reorder')
  reorder(
    @Body() dto: ReorderTasksDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.reorder(dto, request.user);
  }

  @Get('tasks/:id')
  findOne(
    @Param('id') id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.findOne(id, request.user);
  }

  @Put('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.update(id, dto, request.user);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.tasksService.remove(id, request.user);
  }

  @Put('tasks/:id/move')
  move(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.tasksService.move(id, dto, request.user);
  }

  @Get('tasks/:id/subtasks')
  listSubtasks(
    @Param('id') id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.subtasksService.list(id, request.user);
  }

  @Post('tasks/:id/subtasks')
  createSubtask(
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.subtasksService.create(id, dto, request.user);
  }

  @Post('tasks/:id/dependencies')
  addDependency(
    @Param('id') id: string,
    @Body() dto: CreateDependencyDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.dependenciesService.add(id, dto, request.user);
  }

  @Delete('tasks/:id/dependencies/:depId')
  @HttpCode(HttpStatus.OK)
  removeDependency(
    @Param('id') id: string,
    @Param('depId') depId: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.dependenciesService.remove(id, depId, request.user);
  }

  @Get('tasks/:taskId/activity')
  listTaskActivity(
    @Param('taskId') taskId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.activityService.listByEntity(
      'TASK',
      taskId,
      limit ? parseInt(limit, 10) : undefined,
      cursor || undefined,
    );
  }
}
