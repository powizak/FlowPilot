import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { User } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByCalendarToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { calendarToken: token },
    });
  }

  async getOrCreateCalendarToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.calendarToken) {
      return user.calendarToken;
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { calendarToken: token },
    });

    return token;
  }

  async generateICal(userId: string): Promise<string> {
    const { default: ical } = await import('ical-generator');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calendar: any = ical({
      name: 'FlowPilot Tasks',
      prodId: { company: 'FlowPilot', product: 'Task Calendar' },
    });

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { reporterId: userId },
        ],
        dueDate: { not: null },
      },
      include: {
        project: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    for (const task of tasks) {
      if (!task.dueDate) continue;

      calendar.createEvent({
        start: task.dueDate,
        end: task.dueDate,
        summary: task.name,
        description: task.project?.name ?? 'No project',
        allDay: true,
        busy: true,
      });
    }

    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
        OR: [
          { startsAt: { not: null } },
          { endsAt: { not: null } },
        ],
      },
    });

    for (const project of projects) {
      if (project.startsAt || project.endsAt) {
        calendar.createEvent({
          start: project.startsAt ?? project.endsAt!,
          end: project.endsAt ?? project.startsAt!,
          summary: `[Project] ${project.name}`,
          description: project.description ?? '',
          allDay: true,
          busy: false,
        });
      }
    }

    return calendar.toString();
  }
}