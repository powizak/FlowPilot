import { Injectable, NotFoundException } from '@nestjs/common';
import type { AutomationRule } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsAccessService } from '../projects/projects-access.service.js';

interface CreateAutomationDto {
  name: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
  isActive?: boolean;
}

interface UpdateAutomationDto {
  name?: string;
  trigger?: Record<string, unknown>;
  actions?: Record<string, unknown>[];
}

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
  ) {}

  async listByProject(
    projectId: string,
    user: AuthenticatedUser,
  ): Promise<{ data: AutomationRule[] }> {
    await this.access.getProjectWithAccess(projectId, user, 'read');
    const rules = await this.prisma.automationRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rules };
  }

  async create(
    projectId: string,
    dto: CreateAutomationDto,
    user: AuthenticatedUser,
  ): Promise<{ data: AutomationRule }> {
    await this.access.getProjectWithAccess(projectId, user, 'write');
    const rule = await this.prisma.automationRule.create({
      data: {
        projectId,
        name: dto.name,
        trigger: dto.trigger as never,
        actions: dto.actions as never,
        isActive: dto.isActive ?? true,
      },
    });
    return { data: rule };
  }

  async update(
    id: string,
    dto: UpdateAutomationDto,
    user: AuthenticatedUser,
  ): Promise<{ data: AutomationRule }> {
    const rule = await this.getRuleOrThrow(id);
    await this.access.getProjectWithAccess(rule.projectId, user, 'write');
    const updated = await this.prisma.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.trigger !== undefined ? { trigger: dto.trigger as never } : {}),
        ...(dto.actions !== undefined ? { actions: dto.actions as never } : {}),
      },
    });
    return { data: updated };
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ): Promise<{ data: { success: true } }> {
    const rule = await this.getRuleOrThrow(id);
    await this.access.getProjectWithAccess(rule.projectId, user, 'write');
    await this.prisma.automationRule.delete({ where: { id } });
    return { data: { success: true } };
  }

  async toggle(
    id: string,
    user: AuthenticatedUser,
  ): Promise<{ data: AutomationRule }> {
    const rule = await this.getRuleOrThrow(id);
    await this.access.getProjectWithAccess(rule.projectId, user, 'write');
    const updated = await this.prisma.automationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
    return { data: updated };
  }

  private async getRuleOrThrow(id: string): Promise<AutomationRule> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
    });
    if (rule === null) {
      throw new NotFoundException(
        errorResponse('AUTOMATION_NOT_FOUND', 'Automation rule not found'),
      );
    }
    return rule;
  }
}
