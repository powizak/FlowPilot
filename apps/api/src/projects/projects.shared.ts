import { Prisma } from '@prisma/client';

export const projectInclude = Prisma.validator<Prisma.ProjectInclude>()({
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  },
});

export const taskCloneSelect = Prisma.validator<Prisma.TaskSelect>()({
  id: true,
  parentTaskId: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  reporterId: true,
  estimatedHours: true,
  dueDate: true,
  startDate: true,
  trackTime: true,
  billingType: true,
  workTypeId: true,
  position: true,
  labels: true,
  customFields: true,
  doneAt: true,
});

export type ProjectWithMembers = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;
export type TaskCloneRecord = Prisma.TaskGetPayload<{
  select: typeof taskCloneSelect;
}>;
export type AccessLevel = 'read' | 'write' | 'manage_members';
