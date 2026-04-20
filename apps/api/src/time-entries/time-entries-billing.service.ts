import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { applyDurationRounding, calculateDurationMinutes, ensureValidRange } from './time-entries.shared.js';

@Injectable()
export class TimeEntriesBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
    private readonly settings: SettingsService,
  ) {}

  async resolveEntryContext(
    projectId: string,
    taskId: string | null | undefined,
    workTypeId: string | null | undefined,
    user: AuthenticatedUser,
    accessLevel: 'read' | 'write',
  ): Promise<RateContext> {
    await this.access.getProjectWithAccess(projectId, user, accessLevel);
    const context = await this.resolveRateContext(projectId, taskId, workTypeId);
    if (context.task !== null && context.task.projectId !== projectId) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Task does not belong to project'));
    }
    return context;
  }

  async resolveRateContext(
    projectId: string,
    taskId: string | null | undefined,
    workTypeId: string | null | undefined,
  ): Promise<RateContext> {
    const [project, task, workType] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, hourlyRateDefault: true } }),
      taskId === undefined || taskId === null
        ? Promise.resolve(null)
        : this.prisma.task.findUnique({ where: { id: taskId }, select: { id: true, projectId: true, workType: { select: { hourlyRate: true } } } }),
      workTypeId === undefined || workTypeId === null
        ? Promise.resolve(null)
        : this.prisma.workType.findUnique({ where: { id: workTypeId }, select: { id: true, hourlyRate: true } }),
    ]);

    if (project === null) {
      throw new NotFoundException(errorResponse('PROJECT_NOT_FOUND', 'Project not found'));
    }
    if (taskId !== undefined && taskId !== null && task === null) {
      throw new NotFoundException(errorResponse('TASK_NOT_FOUND', 'Task not found'));
    }
    if (workTypeId !== undefined && workTypeId !== null && workType === null) {
      throw new NotFoundException(errorResponse('WORK_TYPE_NOT_FOUND', 'Work type not found'));
    }

    return { project, task, workType };
  }

  async computeEntryValues(startedAt: Date, endedAt: Date, isBillable: boolean, context: RateContext) {
    try {
      ensureValidRange(startedAt, endedAt);
    } catch {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'endedAt must be after startedAt'));
    }

    const durationMinutes = await this.roundDuration(calculateDurationMinutes(startedAt, endedAt));
    return {
      durationMinutes,
      billingAmount: this.calculateBillingAmount(durationMinutes, isBillable, context),
    };
  }

  async roundDuration(minutes: number): Promise<number> {
    const roundingMinutes = await this.getRoundingMinutes();
    return applyDurationRounding(minutes, roundingMinutes);
  }

  calculateBillingAmount(durationMinutes: number, isBillable: boolean, context: RateContext): number | null {
    if (!isBillable) {
      return null;
    }

    const rate = context.project.hourlyRateDefault
      ?? context.workType?.hourlyRate
      ?? context.task?.workType?.hourlyRate
      ?? null;
    if (rate === null) {
      return null;
    }

    return Math.round(((durationMinutes / 60) * Number(rate)) * 100) / 100;
  }

  private async getRoundingMinutes(): Promise<number> {
    try {
      const value = Number(await this.settings.get('timeTracking.roundingMinutes'));
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }
}

export interface RateContext {
  project: { id: string; hourlyRateDefault: Prisma.Decimal | null };
  task: { id: string; projectId: string; workType: { hourlyRate: Prisma.Decimal } | null } | null;
  workType: { id: string; hourlyRate: Prisma.Decimal } | null;
}
