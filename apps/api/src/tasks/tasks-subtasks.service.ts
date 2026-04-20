import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillingType, TaskPriority, type Task } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';
import { toTaskView } from './tasks.mapper.js';
import {
  buildTaskTreeInclude,
  getTaskDeletedAt,
  mergeTaskCustomFields,
  normalizeLabels,
  normalizeOptionalText,
  normalizeTaskTitle,
  parseOptionalDate,
  toInputJson,
  toPrismaTaskStatus,
  toTaskPriority,
} from './tasks.shared.js';
import type { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import type { TaskListResponse, TaskResponse } from './tasks.types.js';

@Injectable()
export class TasksSubtasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
  ) {}

  async list(taskId: string, user: AuthenticatedUser): Promise<TaskListResponse> {
    const parent = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(parent.projectId, user, 'read');

    const subtasks = await this.prisma.task.findMany({
      where: { parentTaskId: taskId },
      include: buildTaskTreeInclude(2),
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    const data = subtasks
      .filter((task) => getTaskDeletedAt(task) === null)
      .map((task) => toTaskView(task, true));

    return { data, total: data.length, page: 1, limit: data.length || 1 };
  }

  async create(taskId: string, dto: CreateSubtaskDto, user: AuthenticatedUser): Promise<TaskResponse> {
    const parent = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(parent.projectId, user, 'write');
    await this.assertParentDepth(parent.id);
    await this.assertRelatedEntities(parent.projectId, dto.assigneeId, dto.reporterId, dto.workTypeId);

    const created = await this.prisma.task.create({
      data: {
        projectId: parent.projectId,
        parentTaskId: parent.id,
        name: normalizeTaskTitle(dto.title),
        description: normalizeOptionalText(dto.description),
        status: toPrismaTaskStatus((dto.status as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | undefined) ?? 'backlog'),
        priority: dto.priority === undefined ? TaskPriority.NONE : toTaskPriority(dto.priority),
        assigneeId: dto.assigneeId ?? null,
        reporterId: dto.reporterId ?? user.id,
        estimatedHours: dto.estimatedHours ?? null,
        dueDate: parseOptionalDate(dto.dueDate),
        startDate: parseOptionalDate(dto.startDate),
        trackTime: dto.trackTime ?? true,
        billingType: this.toBillingType(dto.billingType),
        workTypeId: dto.workTypeId ?? null,
        position: dto.position ?? (await this.getNextSiblingPosition(parent.projectId, parent.id)),
        labels: toInputJson(normalizeLabels(dto.labels)),
        customFields: mergeTaskCustomFields(dto.customFields, {
          workflowStatus: dto.status ?? 'backlog',
        }),
      },
      include: buildTaskTreeInclude(0),
    });

    return { data: toTaskView(created) };
  }

  async validateParentTask(projectId: string, parentId: string | null | undefined, taskId?: string): Promise<string | null> {
    if (parentId === undefined) return undefined as unknown as string | null;
    if (parentId === null) return null;
    if (taskId === parentId) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Task cannot be its own parent'));
    }

    const parent = await this.getTaskOrThrow(parentId);
    if (parent.projectId !== projectId) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Parent task must belong to the same project'));
    }

    await this.assertParentDepth(parent.id);
    if (taskId !== undefined) {
      await this.assertNoHierarchyCycle(taskId, parent.id);
    }

    return parent.id;
  }

  async getNextSiblingPosition(projectId: string, parentTaskId: string | null): Promise<number> {
    const aggregate = await this.prisma.task.aggregate({
      where: { projectId, parentTaskId },
      _max: { position: true },
    });

    return (aggregate._max.position ?? -1) + 1;
  }

  async assertRelatedEntities(
    projectId: string,
    assigneeId?: string | null,
    reporterId?: string | null,
    workTypeId?: string | null,
  ): Promise<void> {
    const checks: Promise<unknown>[] = [];
    if (assigneeId !== undefined && assigneeId !== null) {
      checks.push(this.assertProjectMember(projectId, assigneeId, 'Assignee'));
    }
    if (reporterId !== undefined && reporterId !== null) {
      checks.push(this.assertUserExists(reporterId, 'Reporter'));
    }
    if (workTypeId !== undefined && workTypeId !== null) {
      checks.push(this.assertWorkTypeExists(workTypeId));
    }
    await Promise.all(checks);
  }

  private async assertParentDepth(parentId: string): Promise<void> {
    const depth = await this.getDepth(parentId);
    if (depth >= 3) {
      throw new BadRequestException(errorResponse('SUBTASK_DEPTH_LIMIT', 'Subtask depth limit is 3 levels'));
    }
  }

  private async assertNoHierarchyCycle(taskId: string, parentId: string): Promise<void> {
    let currentId: string | null = parentId;
    while (currentId !== null) {
      if (currentId === taskId) {
        throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Task hierarchy cycle detected'));
      }

      const task: Pick<Task, 'parentTaskId'> | null = await this.prisma.task.findUnique({
        where: { id: currentId },
        select: { parentTaskId: true },
      });
      currentId = task?.parentTaskId ?? null;
    }
  }

  private async getDepth(taskId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = taskId;

    while (currentId !== null) {
      const task: Pick<Task, 'parentTaskId'> | null = await this.prisma.task.findUnique({
        where: { id: currentId },
        select: { parentTaskId: true },
      });

      currentId = task?.parentTaskId ?? null;
      if (currentId !== null) depth += 1;
    }

    return depth;
  }

  private async assertProjectMember(projectId: string, userId: string, label: string): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { userId: true },
    });

    if (membership === null) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', `${label} must be a project member`));
    }
  }

  private async assertUserExists(userId: string, label: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (user === null) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', `${label} not found`));
    }
  }

  private async assertWorkTypeExists(workTypeId: string): Promise<void> {
    const workType = await this.prisma.workType.findUnique({ where: { id: workTypeId }, select: { id: true } });
    if (workType === null) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Work type not found'));
    }
  }

  private async getTaskOrThrow(taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task === null || getTaskDeletedAt(task) !== null) {
      throw new NotFoundException(errorResponse('TASK_NOT_FOUND', 'Task not found'));
    }
    return task;
  }

  private toBillingType(value: string | null | undefined): BillingType | null {
    if (value === undefined || value === null) return null;
    if (value === 'fixed') return BillingType.FIXED;
    if (value === 'retainer') return BillingType.RETAINER;
    if (value === 'hourly') return BillingType.HOURLY;
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid billing type'));
  }
}
