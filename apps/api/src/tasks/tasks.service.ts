import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillingType, TaskPriority, type Task } from '@prisma/client';
import { ActivityService } from '../activity/activity.service.js';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';
import { toTaskView } from './tasks.mapper.js';
import {
  assertWorkflowTransition,
  buildTaskDetailInclude,
  buildTaskTreeInclude,
  getPriorityRank,
  getTaskDeletedAt,
  getWorkflowStatus,
  mergeTaskCustomFields,
  normalizeLabels,
  normalizeOptionalText,
  normalizeTaskTitle,
  parseOptionalDate,
  toInputJson,
  toPrismaTaskStatus,
  toTaskPriority,
} from './tasks.shared.js';
import { AutomationsExecutor } from '../automations/automations.executor.js';
import { TasksSubtasksService } from './tasks-subtasks.service.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import type { MoveTaskDto } from './dto/move-task.dto.js';
import type { ReorderTasksDto } from './dto/reorder-tasks.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import type {
  ApiTaskStatus,
  ReorderTasksResponse,
  TaskListResponse,
  TaskResponse,
  TaskView,
} from './tasks.types.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
    private readonly subtasksService: TasksSubtasksService,
    private readonly activityService: ActivityService,
    private readonly automationsExecutor: AutomationsExecutor,
    private readonly webhooksService: WebhooksService,
  ) {}

  async listProjectTasks(
    projectId: string,
    query: ListTasksQueryDto,
    user: AuthenticatedUser,
  ): Promise<TaskListResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'read');
    return this.listTasks({
      ...query,
      projectId,
      assigneeId: query.assigneeId,
    });
  }

  async listMyTasks(
    query: ListTasksQueryDto,
    user: AuthenticatedUser,
  ): Promise<TaskListResponse> {
    return this.listTasks({ ...query, assigneeId: user.id });
  }

  async create(
    projectId: string,
    dto: CreateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'write');
    const parentId = await this.subtasksService.validateParentTask(
      projectId,
      dto.parentId,
    );
    await this.subtasksService.assertRelatedEntities(
      projectId,
      dto.assigneeId,
      dto.reporterId,
      dto.workTypeId,
    );

    const created = await this.prisma.task.create({
      data: {
        projectId,
        parentTaskId: parentId ?? null,
        name: normalizeTaskTitle(dto.title),
        description: normalizeOptionalText(dto.description),
        status: toPrismaTaskStatus(
          (dto.status as ApiTaskStatus | undefined) ?? 'backlog',
        ),
        priority:
          dto.priority === undefined
            ? TaskPriority.NONE
            : toTaskPriority(dto.priority),
        assigneeId: dto.assigneeId ?? null,
        reporterId: dto.reporterId ?? user.id,
        estimatedHours: dto.estimatedHours ?? null,
        dueDate: parseOptionalDate(dto.dueDate),
        startDate: parseOptionalDate(dto.startDate),
        trackTime: dto.trackTime ?? true,
        billingType: this.toBillingType(dto.billingType),
        workTypeId: dto.workTypeId ?? null,
        position:
          dto.position ??
          (await this.subtasksService.getNextSiblingPosition(
            projectId,
            parentId ?? null,
          )),
        labels: toInputJson(normalizeLabels(dto.labels)),
        customFields: mergeTaskCustomFields(dto.customFields, {
          workflowStatus: dto.status ?? 'backlog',
        }),
      },
      include: buildTaskTreeInclude(0),
    });

    this.activityService.log({
      entityType: 'TASK',
      entityId: created.id,
      userId: user.id,
      action: 'created',
      metadata: { title: created.name, projectId },
    });

    this.automationsExecutor
      .execute(
        { type: 'task.created', taskId: created.id, projectId, payload: {} },
        user.id,
      )
      .catch(() => {});

    this.webhooksService.fire('task.created', {
      taskId: created.id,
      projectId,
      title: created.name,
    });

    return { data: toTaskView(created) };
  }

  async findOne(
    taskId: string,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: buildTaskDetailInclude(),
    });
    if (task === null || getTaskDeletedAt(task) !== null) {
      throw new NotFoundException(
        errorResponse('TASK_NOT_FOUND', 'Task not found'),
      );
    }

    await this.access.getProjectWithAccess(task.projectId, user, 'read');
    return { data: toTaskView(task, true) };
  }

  async update(
    taskId: string,
    dto: UpdateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(task.projectId, user, 'write');
    const nextStatus =
      (dto.status as ApiTaskStatus | undefined) ?? getWorkflowStatus(task);
    if (dto.status !== undefined) {
      assertWorkflowTransition(getWorkflowStatus(task), nextStatus);
    }

    const parentId =
      dto.parentId === undefined
        ? undefined
        : await this.subtasksService.validateParentTask(
            task.projectId,
            dto.parentId,
            task.id,
          );
    await this.subtasksService.assertRelatedEntities(
      task.projectId,
      dto.assigneeId,
      dto.reporterId,
      dto.workTypeId,
    );

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        ...(dto.title === undefined
          ? {}
          : { name: normalizeTaskTitle(dto.title) }),
        ...(dto.description === undefined
          ? {}
          : { description: normalizeOptionalText(dto.description) }),
        ...(dto.status === undefined
          ? {}
          : {
              status: toPrismaTaskStatus(nextStatus),
              doneAt: nextStatus === 'done' ? new Date() : null,
              customFields: mergeTaskCustomFields(task.customFields, {
                workflowStatus: nextStatus,
              }),
            }),
        ...(dto.priority === undefined
          ? {}
          : { priority: toTaskPriority(dto.priority) }),
        ...(dto.assigneeId === undefined ? {} : { assigneeId: dto.assigneeId }),
        ...(dto.reporterId === undefined ? {} : { reporterId: dto.reporterId }),
        ...(dto.estimatedHours === undefined
          ? {}
          : { estimatedHours: dto.estimatedHours }),
        ...(dto.dueDate === undefined
          ? {}
          : { dueDate: parseOptionalDate(dto.dueDate) }),
        ...(dto.startDate === undefined
          ? {}
          : { startDate: parseOptionalDate(dto.startDate) }),
        ...(dto.trackTime === undefined ? {} : { trackTime: dto.trackTime }),
        ...(dto.billingType === undefined
          ? {}
          : { billingType: this.toBillingType(dto.billingType) }),
        ...(dto.workTypeId === undefined ? {} : { workTypeId: dto.workTypeId }),
        ...(dto.position === undefined ? {} : { position: dto.position }),
        ...(dto.labels === undefined
          ? {}
          : { labels: toInputJson(normalizeLabels(dto.labels)) }),
        ...(dto.customFields === undefined
          ? {}
          : {
              customFields: mergeTaskCustomFields(
                task.customFields,
                dto.customFields,
              ),
            }),
        ...(dto.parentId === undefined ? {} : { parentTaskId: parentId }),
      },
      include: buildTaskDetailInclude(),
    });

    const action = dto.status !== undefined ? 'status_changed' : 'updated';
    this.activityService.log({
      entityType: 'TASK',
      entityId: task.id,
      userId: user.id,
      action,
      metadata: {
        changes: Object.keys(dto).filter(
          (k) => (dto as Record<string, unknown>)[k] !== undefined,
        ),
        ...(dto.status !== undefined
          ? { from: getWorkflowStatus(task), to: nextStatus }
          : {}),
      },
    });

    if (dto.status !== undefined) {
      this.automationsExecutor
        .execute(
          {
            type: 'task.status_changed',
            taskId: task.id,
            projectId: task.projectId,
            payload: { from: getWorkflowStatus(task), to: nextStatus },
          },
          user.id,
        )
        .catch(() => {});
    }
    if (dto.assigneeId !== undefined) {
      this.automationsExecutor
        .execute(
          {
            type: 'task.assigned',
            taskId: task.id,
            projectId: task.projectId,
            payload: { assigneeId: dto.assigneeId },
          },
          user.id,
        )
        .catch(() => {});
    }

    this.webhooksService.fire('task.updated', {
      taskId: task.id,
      projectId: task.projectId,
      changes: Object.keys(dto).filter(
        (k) => (dto as Record<string, unknown>)[k] !== undefined,
      ),
    });

    return { data: toTaskView(updated, true) };
  }

  async remove(taskId: string, user: AuthenticatedUser): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(task.projectId, user, 'write');

    const deletedAt = new Date().toISOString();
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: task.status,
        customFields: mergeTaskCustomFields(task.customFields, { deletedAt }),
      },
      include: buildTaskTreeInclude(0),
    });

    return { data: toTaskView(updated) };
  }

  async move(
    taskId: string,
    dto: MoveTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(task.projectId, user, 'write');

    const currentStatus = getWorkflowStatus(task);
    const nextStatus = dto.status as ApiTaskStatus;
    assertWorkflowTransition(currentStatus, nextStatus);

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: toPrismaTaskStatus(nextStatus),
        doneAt: nextStatus === 'done' ? new Date() : null,
        customFields: mergeTaskCustomFields(task.customFields, {
          workflowStatus: nextStatus,
        }),
      },
      include: buildTaskTreeInclude(0),
    });

    this.activityService.log({
      entityType: 'TASK',
      entityId: task.id,
      userId: user.id,
      action: 'status_changed',
      metadata: { from: currentStatus, to: nextStatus },
    });

    this.automationsExecutor
      .execute(
        {
          type: 'task.status_changed',
          taskId: task.id,
          projectId: task.projectId,
          payload: { from: currentStatus, to: nextStatus },
        },
        user.id,
      )
      .catch(() => {});

    return { data: toTaskView(updated) };
  }

  async reorder(
    dto: ReorderTasksDto,
    user: AuthenticatedUser,
  ): Promise<ReorderTasksResponse> {
    if (dto.items.length === 0) {
      return { data: { success: true } };
    }

    const tasks = await this.prisma.task.findMany({
      where: { id: { in: dto.items.map((item) => item.id) } },
      select: { id: true, projectId: true, customFields: true },
    });

    if (
      tasks.length !== dto.items.length ||
      tasks.some((task) => getTaskDeletedAt(task) !== null)
    ) {
      throw new NotFoundException(
        errorResponse('TASK_NOT_FOUND', 'Task not found'),
      );
    }

    const projectIds = [...new Set(tasks.map((task) => task.projectId))];
    for (const projectId of projectIds) {
      await this.access.getProjectWithAccess(projectId, user, 'write');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.task.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    return { data: { success: true } };
  }

  private async listTasks(
    query: ListTasksQueryDto & { projectId?: string },
  ): Promise<TaskListResponse> {
    const dueDateFrom = parseOptionalDate(query.dueDateFrom);
    const dueDateTo = parseOptionalDate(query.dueDateTo);
    const tasks = await this.prisma.task.findMany({
      where: {
        ...(query.projectId === undefined
          ? {}
          : { projectId: query.projectId }),
        ...(query.assigneeId === undefined
          ? {}
          : { assigneeId: query.assigneeId }),
        ...(query.priority === undefined
          ? {}
          : { priority: toTaskPriority(query.priority) }),
        ...(query.status === undefined
          ? {}
          : { status: toPrismaTaskStatus(query.status as ApiTaskStatus) }),
        ...(dueDateFrom === null && dueDateTo === null
          ? {}
          : {
              dueDate: {
                ...(dueDateFrom === null ? {} : { gte: dueDateFrom }),
                ...(dueDateTo === null ? {} : { lte: dueDateTo }),
              },
            }),
      },
      include: buildTaskTreeInclude(0),
    });

    const filtered = tasks
      .filter((task) => getTaskDeletedAt(task) === null)
      .filter((task) =>
        query.status === undefined
          ? true
          : getWorkflowStatus(task) === query.status,
      )
      .map((task) => toTaskView(task));

    const sorted = filtered.sort((left, right) =>
      this.compareTasks(
        left,
        right,
        query.sortBy ?? 'position',
        query.sortOrder ?? 'asc',
      ),
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    const data = sorted.slice(start, start + limit);

    return {
      data,
      total: sorted.length,
      page,
      limit,
    };
  }

  private compareTasks(
    left: TaskView,
    right: TaskView,
    sortBy: string,
    sortOrder: string,
  ): number {
    const direction = sortOrder === 'desc' ? -1 : 1;
    const value = (() => {
      switch (sortBy) {
        case 'createdAt':
          return left.createdAt.getTime() - right.createdAt.getTime();
        case 'updatedAt':
          return left.updatedAt.getTime() - right.updatedAt.getTime();
        case 'dueDate':
          return (
            (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER)
          );
        case 'priority':
          return (
            getPriorityRank(left.priority) - getPriorityRank(right.priority)
          );
        case 'title':
          return left.title.localeCompare(right.title);
        case 'status':
          return left.status.localeCompare(right.status);
        default:
          return left.position - right.position;
      }
    })();

    return value * direction;
  }

  private async getTaskOrThrow(taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task === null || getTaskDeletedAt(task) !== null) {
      throw new NotFoundException(
        errorResponse('TASK_NOT_FOUND', 'Task not found'),
      );
    }
    return task;
  }

  private toBillingType(value: string | null | undefined): BillingType | null {
    if (value === undefined || value === null) return null;
    if (value === 'fixed') return BillingType.FIXED;
    if (value === 'retainer') return BillingType.RETAINER;
    if (value === 'hourly') return BillingType.HOURLY;
    throw new BadRequestException(
      errorResponse('VALIDATION_ERROR', 'Invalid billing type'),
    );
  }
}
