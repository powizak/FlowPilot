import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Notification } from '@prisma/client';

interface MessageEvent {
  data: string | object;
  type?: string;
  id?: string;
}

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly userStreams = new Map<string, Subject<MessageEvent>>();
  private cronIntervals: NodeJS.Timeout[] = [];

  constructor(private readonly prisma: PrismaService) {
    this.setupCronJobs();
  }

  onModuleDestroy(): void {
    for (const interval of this.cronIntervals) {
      clearInterval(interval);
    }
    for (const subject of this.userStreams.values()) {
      subject.complete();
    }
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    entityType?: string,
    entityId?: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, entityType, entityId },
    });

    const stream = this.userStreams.get(userId);
    if (stream) {
      stream.next({ data: notification, type: 'notification' });
    }

    return notification;
  }

  async getNotifications(
    userId: string,
    isRead?: boolean,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(isRead !== undefined ? { isRead } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    let subject = this.userStreams.get(userId);
    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.userStreams.set(userId, subject);
    }

    return new Observable<MessageEvent>((subscriber) => {
      const subscription = subject!.subscribe(subscriber);

      subscriber.next({ data: { connected: true }, type: 'connected' });

      return () => {
        subscription.unsubscribe();
        if (!subject!.observed) {
          this.userStreams.delete(userId);
        }
      };
    });
  }

  private setupCronJobs(): void {
    const ONE_HOUR = 60 * 60 * 1000;

    const runDaily = (hour: number, fn: () => Promise<void>): void => {
      const check = (): void => {
        const now = new Date();
        if (now.getHours() === hour && now.getMinutes() === 0) {
          fn().catch((err) => this.logger.error(`Cron error: ${err.message}`));
        }
      };
      this.cronIntervals.push(setInterval(check, 60_000));
      this.logger.log(`Scheduled cron job at hour ${hour}`);
    };

    runDaily(7, () => this.sendDigest());
    runDaily(8, () => this.checkTasksDueSoon());
    runDaily(9, () => this.checkOverdueTasks());
    runDaily(10, () => this.checkBudgetWarnings());
  }

  private async sendDigest(): Promise<void> {
    const usersWithUnread = await this.prisma.notification.groupBy({
      by: ['userId'],
      where: { isRead: false },
      _count: true,
    });

    for (const { userId, _count } of usersWithUnread) {
      this.logger.log(
        `Digest: user ${userId} has ${_count} unread notifications`,
      );
    }
  }

  private async checkTasksDueSoon(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { gte: tomorrow, lt: dayAfter },
        status: { notIn: ['DONE', 'CANCELLED'] },
        assigneeId: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;
      await this.createNotification(
        task.assigneeId,
        'task_due_soon',
        'Task due tomorrow',
        `"${task.name}" is due tomorrow`,
        'task',
        task.id,
      );
    }

    this.logger.log(`Created ${tasks.length} task-due-soon notifications`);
  }

  private async checkOverdueTasks(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { lt: today },
        status: { notIn: ['DONE', 'CANCELLED'] },
        assigneeId: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;
      await this.createNotification(
        task.assigneeId,
        'task_overdue',
        'Task overdue',
        `"${task.name}" is past its due date`,
        'task',
        task.id,
      );
    }

    this.logger.log(`Created ${tasks.length} task-overdue notifications`);
  }

  private async checkBudgetWarnings(): Promise<void> {
    const projects = await this.prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        budgetHours: { not: null },
      },
      include: {
        members: true,
        timeEntries: {
          select: { durationMinutes: true },
        },
      },
    });

    for (const project of projects) {
      if (!project.budgetHours) continue;

      const totalHours = project.timeEntries.reduce(
        (sum, te) => sum + (te.durationMinutes ?? 0) / 60,
        0,
      );

      if (totalHours / project.budgetHours >= 0.8) {
        const pct = Math.round((totalHours / project.budgetHours) * 100);
        for (const member of project.members) {
          await this.createNotification(
            member.userId,
            'budget_warning',
            'Budget warning',
            `Project "${project.name}" has used ${pct}% of its budget`,
            'project',
            project.id,
          );
        }
      }
    }

    this.logger.log('Budget warnings check completed');
  }
}
