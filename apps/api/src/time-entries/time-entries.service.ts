import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ActivityService } from '../activity/activity.service.js';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';
import type { CreateTimeEntryDto } from './dto/create-time-entry.dto.js';
import type { ListTimeEntriesQueryDto } from './dto/list-time-entries-query.dto.js';
import type { ReportQueryDto } from './dto/report-query.dto.js';
import type { StartTimerDto } from './dto/start-timer.dto.js';
import type { UpdateTimeEntryDto } from './dto/update-time-entry.dto.js';
import {
  TimeEntryRecord,
  timeEntryInclude,
  toTimeEntryView,
} from './time-entries.mapper.js';
import {
  calculateDurationMinutes,
  formatUtcDate,
  parseDateBoundary,
  splitRangeAtMidnight,
} from './time-entries.shared.js';
import { TimeEntriesBillingService } from './time-entries-billing.service.js';

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
    private readonly billing: TimeEntriesBillingService,
    private readonly activityService: ActivityService,
  ) {}

  async list(query: ListTimeEntriesQueryDto, user: AuthenticatedUser) {
    const where = await this.buildWhere(query, user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        include: timeEntryInclude,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return {
      data: entries.map(toTimeEntryView),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateTimeEntryDto, user: AuthenticatedUser) {
    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);
    const context = await this.billing.resolveEntryContext(
      dto.projectId,
      dto.taskId,
      dto.workTypeId,
      user,
      'write',
    );
    const computed = await this.billing.computeEntryValues(
      startedAt,
      endedAt,
      dto.isBillable ?? true,
      context,
    );
    const entry = await this.prisma.timeEntry.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId ?? null,
        userId: user.id,
        workTypeId: dto.workTypeId ?? null,
        description: dto.description?.trim() || null,
        startedAt,
        endedAt,
        durationMinutes: computed.durationMinutes,
        billingAmount: computed.billingAmount,
        isBillable: dto.isBillable ?? true,
      },
      include: timeEntryInclude,
    });

    this.activityService.log({
      entityType: 'TIME_ENTRY',
      entityId: entry.id,
      userId: user.id,
      action: 'created',
      metadata: { projectId: entry.projectId, taskId: entry.taskId },
    });

    return { data: toTimeEntryView(entry) };
  }

  async update(id: string, dto: UpdateTimeEntryDto, user: AuthenticatedUser) {
    const existing = await this.getEntryOrThrow(id);
    this.assertMutable(existing);
    const projectId = dto.projectId ?? existing.projectId;
    const taskId = dto.taskId === undefined ? existing.taskId : dto.taskId;
    const workTypeId =
      dto.workTypeId === undefined ? existing.workTypeId : dto.workTypeId;
    const startedAt =
      dto.startedAt === undefined
        ? existing.startedAt
        : new Date(dto.startedAt);
    const endedAt =
      dto.endedAt === undefined ? existing.endedAt : new Date(dto.endedAt);
    if (endedAt === null) {
      throw new BadRequestException(
        errorResponse('VALIDATION_ERROR', 'endedAt is required'),
      );
    }

    const context = await this.billing.resolveEntryContext(
      projectId,
      taskId,
      workTypeId,
      user,
      'write',
    );
    const computed = await this.billing.computeEntryValues(
      startedAt,
      endedAt,
      dto.isBillable ?? existing.isBillable,
      context,
    );
    const updated = await this.prisma.timeEntry.update({
      where: { id: existing.id },
      data: {
        projectId,
        taskId: taskId ?? null,
        workTypeId: workTypeId ?? null,
        description:
          dto.description === undefined
            ? existing.description
            : dto.description?.trim() || null,
        startedAt,
        endedAt,
        durationMinutes: computed.durationMinutes,
        billingAmount: computed.billingAmount,
        isBillable: dto.isBillable ?? existing.isBillable,
      },
      include: timeEntryInclude,
    });

    this.activityService.log({
      entityType: 'TIME_ENTRY',
      entityId: updated.id,
      userId: user.id,
      action: 'updated',
      metadata: { projectId: updated.projectId, taskId: updated.taskId },
    });

    return { data: toTimeEntryView(updated) };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.getEntryOrThrow(id);
    this.assertMutable(existing);
    await this.access.getProjectWithAccess(existing.projectId, user, 'write');
    const deleted = await this.prisma.timeEntry.delete({
      where: { id: existing.id },
      include: timeEntryInclude,
    });
    return { data: toTimeEntryView(deleted) };
  }

  async start(dto: StartTimerDto, user: AuthenticatedUser) {
    const running = await this.prisma.timeEntry.findFirst({
      where: { userId: user.id, endedAt: null },
    });
    if (running !== null) {
      throw new BadRequestException(
        errorResponse(
          'TIMER_ALREADY_RUNNING',
          'User already has a running timer',
        ),
      );
    }

    await this.billing.resolveEntryContext(
      dto.projectId,
      dto.taskId,
      dto.workTypeId,
      user,
      'write',
    );
    const entry = await this.prisma.timeEntry.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId ?? null,
        userId: user.id,
        workTypeId: dto.workTypeId ?? null,
        description: dto.description?.trim() || null,
        startedAt: new Date(),
        endedAt: null,
        durationMinutes: null,
        billingAmount: null,
        isBillable: dto.isBillable ?? true,
      },
      include: timeEntryInclude,
    });

    this.activityService.log({
      entityType: 'TIME_ENTRY',
      entityId: entry.id,
      userId: user.id,
      action: 'created',
      metadata: { projectId: entry.projectId, taskId: entry.taskId },
    });

    return { data: toTimeEntryView(entry) };
  }

  async stop(user: AuthenticatedUser) {
    const running = await this.prisma.timeEntry.findFirst({
      where: { userId: user.id, endedAt: null },
      include: timeEntryInclude,
    });
    if (running === null) {
      throw new NotFoundException(
        errorResponse('RUNNING_TIMER_NOT_FOUND', 'No running timer found'),
      );
    }

    await this.access.getProjectWithAccess(running.projectId, user, 'write');
    const stoppedAt = new Date();
    const segments = await this.stopWithMidnightSplit(running, stoppedAt);

    this.activityService.log({
      entityType: 'TIME_ENTRY',
      entityId: running.id,
      userId: user.id,
      action: 'updated',
      metadata: { projectId: running.projectId, taskId: running.taskId },
    });

    return { data: segments.map(toTimeEntryView) };
  }

  async running(user: AuthenticatedUser) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { userId: user.id, endedAt: null },
      include: timeEntryInclude,
    });
    return { data: entry === null ? null : toTimeEntryView(entry) };
  }

  async report(query: ReportQueryDto, user: AuthenticatedUser) {
    const where = await this.buildWhere(query, user);
    const entries = await this.prisma.timeEntry.findMany({
      where: { ...where, endedAt: { not: null } },
      include: timeEntryInclude,
      orderBy: [{ startedAt: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped = new Map<
      string,
      {
        key: string;
        label: string;
        durationMinutes: number;
        billingAmount: number;
        count: number;
      }
    >();
    for (const entry of entries) {
      const group = this.getReportGroup(entry, query.groupBy);
      const current = grouped.get(group.key) ?? {
        ...group,
        durationMinutes: 0,
        billingAmount: 0,
        count: 0,
      };
      current.durationMinutes += entry.durationMinutes ?? 0;
      current.billingAmount += Number(entry.billingAmount ?? 0);
      current.count += 1;
      grouped.set(group.key, current);
    }

    return {
      data: [...grouped.values()].map((item) => ({
        ...item,
        billingAmount: Math.round(item.billingAmount * 100) / 100,
      })),
    };
  }

  private async stopWithMidnightSplit(
    entry: TimeEntryRecord,
    stoppedAt: Date,
  ): Promise<TimeEntryRecord[]> {
    const context = await this.billing.resolveRateContext(
      entry.projectId,
      entry.taskId,
      entry.workTypeId,
    );
    const splitRanges = splitRangeAtMidnight(entry.startedAt, stoppedAt);
    const segments = await Promise.all(
      splitRanges.map(async (segment) => ({
        ...segment,
        durationMinutes: await this.billing.roundDuration(
          calculateDurationMinutes(segment.startedAt, segment.endedAt),
        ),
      })),
    );

    const [first, ...rest] = segments;
    const updatedFirst = this.prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        endedAt: first.endedAt,
        durationMinutes: first.durationMinutes,
        billingAmount: this.billing.calculateBillingAmount(
          first.durationMinutes,
          entry.isBillable,
          context,
        ),
      },
      include: timeEntryInclude,
    });

    const createdRest = rest.map((segment) =>
      this.prisma.timeEntry.create({
        data: {
          projectId: entry.projectId,
          taskId: entry.taskId,
          userId: entry.userId,
          workTypeId: entry.workTypeId,
          description: entry.description,
          startedAt: segment.startedAt,
          endedAt: segment.endedAt,
          durationMinutes: segment.durationMinutes,
          billingAmount: this.billing.calculateBillingAmount(
            segment.durationMinutes,
            entry.isBillable,
            context,
          ),
          isBillable: entry.isBillable,
        },
        include: timeEntryInclude,
      }),
    );

    return this.prisma.$transaction([updatedFirst, ...createdRest]);
  }

  private async buildWhere(
    query: QueryFilters,
    user: AuthenticatedUser,
  ): Promise<Prisma.TimeEntryWhereInput> {
    if (query.projectId !== undefined) {
      await this.access.getProjectWithAccess(query.projectId, user, 'read');
    }

    const visibleProjectIds =
      query.projectId === undefined
        ? await this.getVisibleProjectIds(user)
        : undefined;
    return {
      ...(query.projectId === undefined
        ? visibleProjectIds === null
          ? {}
          : { projectId: { in: visibleProjectIds } }
        : { projectId: query.projectId }),
      ...(query.userId === undefined ? {} : { userId: query.userId }),
      ...(query.taskId === undefined ? {} : { taskId: query.taskId }),
      ...(query.isBillable === undefined
        ? {}
        : { isBillable: query.isBillable }),
      ...(query.dateFrom === undefined && query.dateTo === undefined
        ? {}
        : {
            startedAt: {
              ...(query.dateFrom === undefined
                ? {}
                : { gte: parseDateBoundary(query.dateFrom, 'start') }),
              ...(query.dateTo === undefined
                ? {}
                : { lte: parseDateBoundary(query.dateTo, 'end') }),
            },
          }),
    };
  }

  private async getEntryOrThrow(id: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: timeEntryInclude,
    });
    if (entry === null) {
      throw new NotFoundException(
        errorResponse('TIME_ENTRY_NOT_FOUND', 'Time entry not found'),
      );
    }
    return entry;
  }

  private assertMutable(entry: { invoiceId: string | null }) {
    if (entry.invoiceId !== null) {
      throw new ConflictException(
        errorResponse(
          'TIME_ENTRY_INVOICED',
          'Invoiced time entries cannot be modified',
        ),
      );
    }
  }

  private async getVisibleProjectIds(
    user: AuthenticatedUser,
  ): Promise<string[] | null> {
    if (this.access.isAdmin(user)) {
      return null;
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });
    return memberships.map((membership) => membership.projectId);
  }

  private getReportGroup(
    entry: TimeEntryRecord,
    groupBy: ReportQueryDto['groupBy'],
  ): { key: string; label: string } {
    if (groupBy === 'project') {
      return { key: entry.projectId, label: entry.project.name };
    }
    if (groupBy === 'user') {
      return { key: entry.userId, label: entry.user.name };
    }
    if (groupBy === 'workType') {
      return entry.workType === null
        ? { key: 'none', label: 'No work type' }
        : { key: entry.workType.id, label: entry.workType.name };
    }
    return {
      key: formatUtcDate(entry.startedAt),
      label: formatUtcDate(entry.startedAt),
    };
  }
}

type QueryFilters =
  | Pick<
      ListTimeEntriesQueryDto,
      'dateFrom' | 'dateTo' | 'userId' | 'projectId' | 'taskId' | 'isBillable'
    >
  | Pick<
      ReportQueryDto,
      'dateFrom' | 'dateTo' | 'userId' | 'projectId' | 'taskId' | 'isBillable'
    >;
