import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, TaskStatus } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createInvoiceFromEntries, getProjectStats } from './mcp.billing.js';
import {
  assertProjectAccess,
  type CreateTaskInput,
  type CreateTimeEntryInput,
  optionalDate,
  optionalText,
  type ProjectFilters,
  requireText,
  startOfToday,
  toTaskStatus,
  type UpdateTaskInput,
} from './mcp.shared.js';

@Injectable()
export class McpService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjects(userId: string, filters?: ProjectFilters) {
    return this.prisma.project.findMany({
      where: {
        members: { some: { userId } },
        ...(filters?.status === undefined
          ? {}
          : { status: filters.status as never }),
        ...(filters?.tags === undefined || filters.tags.length === 0
          ? {}
          : { tags: { array_contains: filters.tags } }),
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true, timeEntries: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getProjectById(id: string, userId?: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        ...(userId === undefined ? {} : { members: { some: { userId } } }),
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    });
    if (project === null)
      throw new NotFoundException(
        errorResponse('PROJECT_NOT_FOUND', 'Project not found'),
      );
    return project;
  }

  async getTasksByProject(projectId: string, userId?: string) {
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, projectId, userId);
    return this.prisma.task.findMany({
      where: { projectId },
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTaskById(id: string, userId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    if (task === null)
      throw new NotFoundException(
        errorResponse('TASK_NOT_FOUND', 'Task not found'),
      );
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, task.projectId, userId);
    return task;
  }

  async getClients() {
    return this.prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpenInvoices(userId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] },
        ...(userId === undefined
          ? {}
          : { project: { members: { some: { userId } } } }),
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getTodayTimeEntries(userId: string) {
    return this.prisma.timeEntry.findMany({
      where: { userId, startedAt: { gte: startOfToday() } },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getMyAssignedTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId, status: { not: TaskStatus.DONE } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async createTask(data: CreateTaskInput, userId: string) {
    await assertProjectAccess(this.prisma, data.projectId, userId);
    return this.prisma.task.create({
      data: {
        projectId: data.projectId,
        name: requireText(data.name, 'Task name is required'),
        description: optionalText(data.description),
        assigneeId: data.assigneeId ?? null,
        reporterId: userId,
        dueDate: optionalDate(data.dueDate),
      },
    });
  }

  async updateTask(id: string, data: UpdateTaskInput, userId?: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });
    if (existing === null)
      throw new NotFoundException(
        errorResponse('TASK_NOT_FOUND', 'Task not found'),
      );
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, existing.projectId, userId);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(data.name === undefined
          ? {}
          : { name: requireText(data.name, 'Task name is required') }),
        ...(data.description === undefined
          ? {}
          : { description: optionalText(data.description) }),
        ...(data.status === undefined
          ? {}
          : { status: toTaskStatus(data.status) }),
        ...(data.assigneeId === undefined
          ? {}
          : { assigneeId: data.assigneeId }),
        ...(data.dueDate === undefined
          ? {}
          : { dueDate: optionalDate(data.dueDate) }),
      },
    });
  }

  async createTimeEntry(data: CreateTimeEntryInput, userId: string) {
    await assertProjectAccess(this.prisma, data.projectId, userId);
    const startedAt = new Date(data.startedAt);
    const endedAt = new Date(data.endedAt);
    const durationMinutes =
      data.durationMinutes ??
      Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000),
      );
    return this.prisma.timeEntry.create({
      data: {
        projectId: data.projectId,
        taskId: data.taskId ?? null,
        userId,
        workTypeId: data.workTypeId ?? null,
        description: requireText(
          data.description,
          'Time entry description is required',
        ),
        startedAt,
        endedAt,
        durationMinutes,
      },
    });
  }

  async getUninvoicedEntries(projectId: string, userId?: string) {
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, projectId, userId);
    return this.prisma.timeEntry.findMany({
      where: { projectId, invoiceId: null },
      include: {
        task: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'asc' },
    });
  }

  async createInvoiceFromEntries(projectId: string, userId?: string) {
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, projectId, userId);
    return createInvoiceFromEntries(this.prisma, projectId);
  }

  async getProjectStats(projectId: string, userId?: string) {
    if (userId !== undefined)
      await assertProjectAccess(this.prisma, projectId, userId);
    return getProjectStats(this.prisma, projectId);
  }
}
