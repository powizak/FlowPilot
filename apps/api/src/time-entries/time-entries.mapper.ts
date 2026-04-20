import type { Prisma } from '@prisma/client';
import { toNumber } from '../projects/projects.mapper.js';

export const timeEntryInclude = {
  project: { select: { id: true, name: true } },
  task: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
  workType: { select: { id: true, name: true, hourlyRate: true, color: true, isActive: true } },
} satisfies Prisma.TimeEntryInclude;

export type TimeEntryRecord = Prisma.TimeEntryGetPayload<{ include: typeof timeEntryInclude }>;

export function toTimeEntryView(entry: TimeEntryRecord) {
  return {
    id: entry.id,
    taskId: entry.taskId,
    projectId: entry.projectId,
    userId: entry.userId,
    workTypeId: entry.workTypeId,
    invoiceId: entry.invoiceId,
    description: entry.description,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationMinutes: entry.durationMinutes,
    billingAmount: toNumber(entry.billingAmount),
    isBillable: entry.isBillable,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    project: entry.project,
    task: entry.task === null ? null : { id: entry.task.id, title: entry.task.name },
    user: entry.user,
    workType:
      entry.workType === null
        ? null
        : {
            id: entry.workType.id,
            name: entry.workType.name,
            hourlyRate: Number(entry.workType.hourlyRate),
            color: entry.workType.color,
            isActive: entry.workType.isActive,
          },
  };
}
