import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export type ProjectFilters = { status?: string; tags?: string[] };
export type CreateTaskInput = {
  projectId: string;
  name: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
};
export type UpdateTaskInput = Partial<{
  name: string;
  description: string;
  status: string;
  assigneeId: string | null;
  dueDate: string | null;
}>;
export type CreateTimeEntryInput = {
  projectId: string;
  taskId?: string;
  description: string;
  startedAt: string;
  endedAt: string;
  durationMinutes?: number;
  workTypeId?: string;
};

export async function assertProjectAccess(
  prisma: PrismaService,
  projectId: string,
  userId: string,
) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (membership === null)
    throw new ForbiddenException(
      errorResponse('FORBIDDEN', 'Project access denied'),
    );
}

export function requireText(value: string, message: string) {
  const text = value.trim();
  if (text.length === 0)
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', message));
  return text;
}

export function optionalText(value: string | null | undefined) {
  if (value === undefined || value === null) return null;
  const text = value.trim();
  return text.length === 0 ? null : text;
}

export function optionalDate(value: string | null | undefined) {
  if (value === undefined || value === null) return null;
  return new Date(value);
}

export function toTaskStatus(status: string) {
  if (status === 'DONE' || status === 'done') return TaskStatus.DONE;
  if (
    status === 'IN_PROGRESS' ||
    status === 'in_progress' ||
    status === 'review'
  )
    return TaskStatus.IN_PROGRESS;
  if (status === 'CANCELLED' || status === 'cancelled')
    return TaskStatus.CANCELLED;
  return TaskStatus.TODO;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function toRoundedHours(durationMinutes: number | null | undefined) {
  return Math.round(((durationMinutes ?? 0) / 60 + Number.EPSILON) * 100) / 100;
}
