import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { errorResponse } from '../auth/auth.errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TaskCloneRecord } from './projects.shared.js';
import { projectInclude, taskCloneSelect } from './projects.shared.js';
import type { ProjectWithMembers } from './projects.shared.js';

@Injectable()
export class ProjectsCloneService {
  constructor(private readonly prisma: PrismaService) {}

  async cloneProject(
    projectId: string,
    name: string,
  ): Promise<ProjectWithMembers> {
    const project = await this.prisma.$transaction(async (tx) => {
      const source = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
          tasks: {
            select: taskCloneSelect,
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (source === null) {
        throw new NotFoundException(
          errorResponse('PROJECT_NOT_FOUND', 'Project not found'),
        );
      }

      const clone = await tx.project.create({
        data: {
          name,
          clientId: source.clientId,
          status: ProjectStatus.ACTIVE,
          billingType: source.billingType,
          currency: source.currency,
          defaultVatPercent: source.defaultVatPercent,
          budgetHours: source.budgetHours,
          budgetAmount: source.budgetAmount,
          hourlyRateDefault: source.hourlyRateDefault,
          startsAt: source.startsAt,
          endsAt: source.endsAt,
          tags: this.toInputJson(source.tags),
          description: source.description,
          deletedAt: null,
          members: {
            create: source.members.map((member) => ({
              userId: member.userId,
              role: member.role,
            })),
          },
        },
      });

      await this.cloneTasks(tx, source.tasks, clone.id);

      return tx.project.findUnique({
        where: { id: clone.id },
        include: projectInclude,
      });
    });

    if (project === null) {
      throw new NotFoundException(
        errorResponse('PROJECT_NOT_FOUND', 'Project not found'),
      );
    }

    return project;
  }

  private async cloneTasks(
    tx: Prisma.TransactionClient,
    tasks: TaskCloneRecord[],
    projectId: string,
  ): Promise<void> {
    const children = new Map<string | null, TaskCloneRecord[]>();

    for (const task of tasks) {
      const bucket = children.get(task.parentTaskId) ?? [];
      bucket.push(task);
      children.set(task.parentTaskId, bucket);
    }

    const cloneBranch = async (
      parentId: string | null,
      newParentId: string | null,
    ): Promise<void> => {
      for (const task of children.get(parentId) ?? []) {
        const newTaskId = randomUUID();

        await tx.task.create({
          data: {
            id: newTaskId,
            projectId,
            parentTaskId: newParentId,
            name: task.name,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            reporterId: task.reporterId,
            estimatedHours: task.estimatedHours,
            dueDate: task.dueDate,
            startDate: task.startDate,
            trackTime: task.trackTime,
            billingType: task.billingType,
            workTypeId: task.workTypeId,
            position: task.position,
            labels: this.toInputJson(task.labels),
            customFields: this.toInputJson(task.customFields),
            doneAt: task.doneAt,
          },
        });

        await cloneBranch(task.id, newTaskId);
      }
    };

    await cloneBranch(null, null);
  }

  private toInputJson(
    value: Prisma.JsonValue,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  }
}
