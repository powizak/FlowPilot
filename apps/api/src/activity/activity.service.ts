import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface LogActivityParams {
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ActivityLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

const ACTIVITY_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: LogActivityParams): void {
    this.prisma.activityLog
      .create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          userId: params.userId,
          action: params.action,
          metadata: params.metadata ?? undefined,
        },
      })
      .catch(() => {});
  }

  async listByEntity(
    entityType: string,
    entityId: string,
    limit = 50,
    cursor?: string,
  ): Promise<{ data: ActivityLogEntry[]; nextCursor: string | null }> {
    const items = await this.prisma.activityLog.findMany({
      where: { entityType, entityId },
      include: { user: { select: ACTIVITY_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data: data as ActivityLogEntry[], nextCursor };
  }
}
