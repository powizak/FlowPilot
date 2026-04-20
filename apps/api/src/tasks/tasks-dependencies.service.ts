import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';
import { toTaskView } from './tasks.mapper.js';
import { buildTaskTreeInclude, getTaskDeletedAt, toPrismaDependencyType } from './tasks.shared.js';
import type { CreateDependencyDto } from './dto/create-dependency.dto.js';
import type { TaskResponse } from './tasks.types.js';

@Injectable()
export class TasksDependenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
  ) {}

  async add(taskId: string, dto: CreateDependencyDto, user: AuthenticatedUser): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(taskId);
    const dependency = await this.getTaskOrThrow(dto.dependencyTaskId);
    if (task.projectId !== dependency.projectId) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Dependencies must stay within one project'));
    }

    await this.access.getProjectWithAccess(task.projectId, user, 'write');

    if (task.id === dependency.id) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Task cannot depend on itself'));
    }

    const circular = await this.hasPath(dependency.id, task.id);
    if (circular) {
      throw new BadRequestException(errorResponse('CIRCULAR_DEPENDENCY', 'Circular dependency detected'));
    }

    try {
      await this.prisma.taskDependency.create({
        data: {
          taskId: task.id,
          dependsOnId: dependency.id,
          type: toPrismaDependencyType(dto.type as 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH'),
        },
      });
    } catch {
      throw new ConflictException(errorResponse('DEPENDENCY_EXISTS', 'Dependency already exists'));
    }

    const updated = await this.prisma.task.findUnique({
      where: { id: task.id },
      include: {
        ...buildTaskTreeInclude(0),
        dependencies: {
          include: {
            dependsOn: {
              include: buildTaskTreeInclude(0),
            },
          },
        },
      },
    });

    if (updated === null) {
      throw new NotFoundException(errorResponse('TASK_NOT_FOUND', 'Task not found'));
    }

    return { data: toTaskView(updated, true) };
  }

  async remove(taskId: string, depId: string, user: AuthenticatedUser): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(taskId);
    await this.access.getProjectWithAccess(task.projectId, user, 'write');

    const dependsOnId = depId.includes(':') ? depId.split(':').at(-1) ?? depId : depId;
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { taskId_dependsOnId: { taskId, dependsOnId } },
      select: { taskId: true },
    });

    if (dependency === null) {
      throw new NotFoundException(errorResponse('TASK_DEPENDENCY_NOT_FOUND', 'Task dependency not found'));
    }

    await this.prisma.taskDependency.delete({
      where: { taskId_dependsOnId: { taskId, dependsOnId } },
    });

    const updated = await this.prisma.task.findUnique({
      where: { id: task.id },
      include: {
        ...buildTaskTreeInclude(0),
        dependencies: {
          include: {
            dependsOn: {
              include: buildTaskTreeInclude(0),
            },
          },
        },
      },
    });

    if (updated === null) {
      throw new NotFoundException(errorResponse('TASK_NOT_FOUND', 'Task not found'));
    }

    return { data: toTaskView(updated, true) };
  }

  private async hasPath(fromId: string, targetId: string): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [fromId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (currentId === undefined || visited.has(currentId)) continue;
      if (currentId === targetId) return true;

      visited.add(currentId);

      const edges = await this.prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnId: true },
      });

      for (const edge of edges) {
        stack.push(edge.dependsOnId);
      }
    }

    return false;
  }

  private async getTaskOrThrow(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task === null || getTaskDeletedAt(task) !== null) {
      throw new NotFoundException(errorResponse('TASK_NOT_FOUND', 'Task not found'));
    }
    return task;
  }
}
