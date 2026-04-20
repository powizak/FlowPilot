import { BadRequestException } from '@nestjs/common';
import {
  BillingType,
  DependencyType,
  Prisma,
  TaskPriority,
  TaskStatus,
  type Task,
} from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { ApiDependencyType, ApiTaskPriority, ApiTaskStatus } from './tasks.types.js';

export const TASK_WORKFLOW_ORDER: ApiTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export const taskUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

export const taskBaseInclude = {
  assignee: { select: taskUserSelect },
  reporter: { select: taskUserSelect },
  timeEntries: { select: { durationMinutes: true } },
} as const satisfies Prisma.TaskInclude;

export function buildTaskTreeInclude(depth: number): Prisma.TaskInclude {
  if (depth <= 0) {
    return { ...taskBaseInclude };
  }

  return {
    ...taskBaseInclude,
    childTasks: {
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: buildTaskTreeInclude(depth - 1),
    },
  };
}

export function buildTaskDetailInclude(): Prisma.TaskInclude {
  return {
    ...buildTaskTreeInclude(3),
    dependencies: {
      include: {
        dependsOn: {
          include: taskBaseInclude,
        },
      },
    },
  };
}

export function normalizeTaskTitle(value: string): string {
  const title = value.trim();
  if (title.length === 0) {
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Task title is required'));
  }
  return title;
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const text = value.trim();
  return text.length === 0 ? null : text;
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid date value'));
  }
  return date;
}

export function normalizeLabels(value: string[] | undefined): string[] {
  return (value ?? [])
    .map((label) => label.trim())
    .filter((label, index, all) => label.length > 0 && all.indexOf(label) === index);
}

export function normalizeCustomFields(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

export function mergeTaskCustomFields(current: unknown, patch: Record<string, unknown>): Prisma.InputJsonValue {
  const fields = normalizeCustomFields(current);
  return {
    ...fields,
    ...patch,
  } as Prisma.InputJsonValue;
}

export function normalizeTaskMetadata(value: unknown): Record<string, unknown> {
  const fields = normalizeCustomFields(value);
  const { workflowStatus, deletedAt, ...rest } = fields;
  return rest;
}

export function getTaskDeletedAt(task: Pick<Task, 'customFields'>): Date | null {
  const deletedAt = normalizeCustomFields(task.customFields).deletedAt;
  if (typeof deletedAt !== 'string') return null;

  const date = new Date(deletedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getWorkflowStatus(task: Pick<Task, 'status' | 'customFields'>): ApiTaskStatus {
  const workflowStatus = normalizeCustomFields(task.customFields).workflowStatus;
  if (workflowStatus === 'backlog' || workflowStatus === 'todo' || workflowStatus === 'in_progress' || workflowStatus === 'review' || workflowStatus === 'done' || workflowStatus === 'cancelled') {
    return workflowStatus;
  }

  switch (task.status) {
    case TaskStatus.TODO:
      return 'todo';
    case TaskStatus.IN_PROGRESS:
      return 'in_progress';
    case TaskStatus.DONE:
      return 'done';
    case TaskStatus.CANCELLED:
      return 'cancelled';
  }
}

export function toPrismaTaskStatus(status: ApiTaskStatus): TaskStatus {
  switch (status) {
    case 'backlog':
    case 'todo':
      return TaskStatus.TODO;
    case 'in_progress':
    case 'review':
      return TaskStatus.IN_PROGRESS;
    case 'done':
      return TaskStatus.DONE;
    case 'cancelled':
      return TaskStatus.CANCELLED;
  }
}

export function toTaskPriority(priority: string): TaskPriority {
  switch (priority) {
    case 'low':
      return TaskPriority.LOW;
    case 'medium':
      return TaskPriority.MEDIUM;
    case 'high':
      return TaskPriority.HIGH;
    case 'urgent':
      return TaskPriority.URGENT;
    case 'none':
      return TaskPriority.NONE;
    default:
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid task priority'));
  }
}

export function toApiTaskPriority(priority: TaskPriority): ApiTaskPriority {
  switch (priority) {
    case TaskPriority.LOW:
      return 'low';
    case TaskPriority.MEDIUM:
      return 'medium';
    case TaskPriority.HIGH:
      return 'high';
    case TaskPriority.URGENT:
      return 'urgent';
    case TaskPriority.NONE:
      return 'none';
  }
}

export function toPrismaDependencyType(type: ApiDependencyType): DependencyType {
  switch (type) {
    case 'START_TO_START':
      return DependencyType.BLOCKED_BY;
    case 'FINISH_TO_FINISH':
      return DependencyType.RELATES_TO;
    case 'FINISH_TO_START':
      return DependencyType.BLOCKS;
  }
}

export function toApiDependencyType(type: DependencyType): ApiDependencyType {
  switch (type) {
    case DependencyType.BLOCKED_BY:
      return 'START_TO_START';
    case DependencyType.RELATES_TO:
      return 'FINISH_TO_FINISH';
    case DependencyType.BLOCKS:
      return 'FINISH_TO_START';
  }
}

export function toApiBillingType(billingType: BillingType | null): 'hourly' | 'fixed' | 'retainer' | null {
  if (billingType === null) return null;
  switch (billingType) {
    case BillingType.FIXED:
      return 'fixed';
    case BillingType.RETAINER:
      return 'retainer';
    case BillingType.HOURLY:
      return 'hourly';
  }
}

export function toInputJson(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function assertWorkflowTransition(current: ApiTaskStatus, next: ApiTaskStatus): void {
  if (current === next) return;

  if (next === 'cancelled') {
    if (current === 'done') {
      throw new BadRequestException(errorResponse('INVALID_WORKFLOW_TRANSITION', 'Completed task cannot be cancelled'));
    }
    return;
  }

  if (current === 'cancelled') {
    throw new BadRequestException(errorResponse('INVALID_WORKFLOW_TRANSITION', 'Cancelled task cannot be reopened'));
  }

  const currentIndex = TASK_WORKFLOW_ORDER.indexOf(current);
  const nextIndex = TASK_WORKFLOW_ORDER.indexOf(next);
  if (currentIndex === -1 || nextIndex === -1 || Math.abs(currentIndex - nextIndex) !== 1) {
    throw new BadRequestException(errorResponse('INVALID_WORKFLOW_TRANSITION', 'Invalid workflow transition'));
  }
}

export function getPriorityRank(priority: ApiTaskPriority): number {
  switch (priority) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    case 'none':
      return 0;
  }
}
