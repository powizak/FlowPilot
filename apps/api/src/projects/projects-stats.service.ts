import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toNumber } from './projects.mapper.js';
import type { ProjectStats } from './projects.types.js';

@Injectable()
export class ProjectsStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildProjectStats(projectId: string): Promise<ProjectStats> {
    const [project, timeEntries, totalTasks, completedTasks] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { budgetHours: true, budgetAmount: true, hourlyRateDefault: true },
      }),
      this.prisma.timeEntry.findMany({
        where: { projectId },
        select: {
          startedAt: true,
          endedAt: true,
          durationMinutes: true,
          workType: {
            select: { hourlyRate: true },
          },
        },
      }),
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({ where: { projectId, status: TaskStatus.DONE } }),
    ]);

    if (project === null) {
      throw new NotFoundException(errorResponse('PROJECT_NOT_FOUND', 'Project not found'));
    }

    const actualMinutes = timeEntries.reduce(
      (sum, entry) => sum + this.getDurationMinutes(entry.startedAt, entry.endedAt, entry.durationMinutes),
      0,
    );
    const actualHours = this.round(actualMinutes / 60);
    const actualAmount = this.round(
      timeEntries.reduce((sum, entry) => {
        const minutes = this.getDurationMinutes(entry.startedAt, entry.endedAt, entry.durationMinutes);
        const rate = entry.workType?.hourlyRate ?? project.hourlyRateDefault;
        return sum + (minutes / 60) * Number(rate ?? 0);
      }, 0),
    );
    const budgetHours = project.budgetHours;
    const budgetAmount = toNumber(project.budgetAmount);

    return {
      budgetHours,
      actualHours,
      hoursVariance: budgetHours === null ? null : this.round(actualHours - budgetHours),
      budgetAmount,
      actualAmount,
      amountVariance: budgetAmount === null ? null : this.round(actualAmount - budgetAmount),
      totalTasks,
      completedTasks,
      taskCompletionPercent: totalTasks === 0 ? 0 : this.round((completedTasks / totalTasks) * 100),
    };
  }

  private getDurationMinutes(
    startedAt: Date,
    endedAt: Date | null,
    durationMinutes: number | null,
  ): number {
    if (durationMinutes !== null) {
      return durationMinutes;
    }

    if (endedAt === null) {
      return 0;
    }

    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
