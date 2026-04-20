import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillingType, ProjectMemberRole, ProjectStatus, type Prisma } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toProjectListItem, toProjectMemberView, toProjectView } from './projects.mapper.js';
import { ProjectsAccessService } from './projects-access.service.js';
import { ProjectsCloneService } from './projects-clone.service.js';
import { ProjectsStatsService } from './projects-stats.service.js';
import type { AddProjectMemberDto } from './dto/add-project-member.dto.js';
import type { CloneProjectDto } from './dto/clone-project.dto.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ListProjectsQueryDto } from './dto/list-projects-query.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';
import type {
  ProjectMemberResponse,
  ProjectResponse,
  ProjectStatsResponse,
  ProjectsListResponse,
  RemoveProjectMemberResponse,
} from './projects.types.js';
import { projectInclude } from './projects.shared.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
    private readonly statsService: ProjectsStatsService,
    private readonly cloneService: ProjectsCloneService,
  ) {}

  async list(query: ListProjectsQueryDto, user: AuthenticatedUser): Promise<ProjectsListResponse> {
    const { page, limit, status, tags } = this.normalizeListQuery(query);
    const where: Prisma.ProjectWhereInput = {
      ...(status === undefined ? {} : { status }),
      ...(tags.length === 0 ? {} : { tags: { array_contains: tags } }),
      ...(this.access.isAdmin(user) ? {} : { members: { some: { userId: user.id } } }),
    };

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: projects.map((project) => toProjectListItem(project, user.id)),
      total,
      page,
      limit,
    };
  }

  async create(dto: CreateProjectDto, user: AuthenticatedUser): Promise<ProjectResponse> {
    this.access.assertCanCreate(user);

    const project = await this.prisma.project.create({
      data: {
        ...this.toProjectCreateInput(dto),
        members: {
          create: {
            userId: user.id,
            role: ProjectMemberRole.OWNER,
          },
        },
      },
      include: projectInclude,
    });

    return { data: toProjectView(project) };
  }

  async findOne(projectId: string, user: AuthenticatedUser): Promise<ProjectResponse> {
    const project = await this.access.getProjectWithAccess(projectId, user, 'read');
    return { data: toProjectView(project, await this.statsService.buildProjectStats(projectId)) };
  }

  async update(projectId: string, dto: UpdateProjectDto, user: AuthenticatedUser): Promise<ProjectResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'write');

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: this.toProjectUpdateInput(dto),
      include: projectInclude,
    });

    return { data: toProjectView(project) };
  }

  async archive(projectId: string, user: AuthenticatedUser): Promise<ProjectResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'write');

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ARCHIVED, deletedAt: new Date() },
      include: projectInclude,
    });

    return { data: toProjectView(project) };
  }

  async stats(projectId: string, user: AuthenticatedUser): Promise<ProjectStatsResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'read');
    return { data: await this.statsService.buildProjectStats(projectId) };
  }

  async clone(projectId: string, dto: CloneProjectDto, user: AuthenticatedUser): Promise<ProjectResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'write');
    return { data: toProjectView(await this.cloneService.cloneProject(projectId, this.requireName(dto.name))) };
  }

  async addMember(
    projectId: string,
    dto: AddProjectMemberDto,
    user: AuthenticatedUser,
  ): Promise<ProjectMemberResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'manage_members');

    const existingUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (existingUser === null) {
      throw new NotFoundException(errorResponse('USER_NOT_FOUND', 'User not found'));
    }

    const member = await this.prisma.projectMember.upsert({
      where: { userId_projectId: { userId: dto.userId, projectId } },
      update: { role: this.toMemberRole(dto.role) },
      create: { projectId, userId: dto.userId, role: this.toMemberRole(dto.role) },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    return { data: toProjectMemberView(member) };
  }

  async removeMember(
    projectId: string,
    userId: string,
    user: AuthenticatedUser,
  ): Promise<RemoveProjectMemberResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'manage_members');

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { userId: true },
    });

    if (membership === null) {
      throw new NotFoundException(errorResponse('PROJECT_MEMBER_NOT_FOUND', 'Project member not found'));
    }

    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    return { data: { success: true } };
  }

  private normalizeListQuery(query: ListProjectsQueryDto) {
    return {
      page: this.parsePositiveInteger(query.page, 1),
      limit: Math.min(this.parsePositiveInteger(query.limit, 20), 100),
      status: query.status === undefined ? undefined : this.toProjectStatus(query.status),
      tags: (query.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };
  }

  private toProjectCreateInput(dto: CreateProjectDto): Prisma.ProjectCreateInput {
    return {
      name: this.requireName(dto.name),
      clientId: dto.clientId ?? null,
      status: dto.status === undefined ? ProjectStatus.ACTIVE : this.toProjectStatus(dto.status),
      billingType: dto.billingType === undefined ? BillingType.HOURLY : this.toBillingType(dto.billingType),
      budgetHours: dto.budgetHours ?? null,
      budgetAmount: dto.budgetAmount ?? null,
      hourlyRateDefault: dto.hourlyRateDefault ?? null,
      startsAt: this.toDate(dto.startsAt),
      endsAt: this.toDate(dto.endsAt),
      tags: this.normalizeTags(dto.tags),
      description: this.toNullableText(dto.description),
    };
  }

  private toProjectUpdateInput(dto: UpdateProjectDto): Prisma.ProjectUpdateInput {
    const status = dto.status === undefined ? undefined : this.toProjectStatus(dto.status);

    return {
      ...(dto.name === undefined ? {} : { name: this.requireName(dto.name) }),
      ...(dto.clientId === undefined ? {} : { clientId: dto.clientId }),
      ...(status === undefined ? {} : { status, deletedAt: status === ProjectStatus.ARCHIVED ? new Date() : null }),
      ...(dto.billingType === undefined ? {} : { billingType: this.toBillingType(dto.billingType) }),
      ...(dto.budgetHours === undefined ? {} : { budgetHours: dto.budgetHours }),
      ...(dto.budgetAmount === undefined ? {} : { budgetAmount: dto.budgetAmount }),
      ...(dto.hourlyRateDefault === undefined ? {} : { hourlyRateDefault: dto.hourlyRateDefault }),
      ...(dto.startsAt === undefined ? {} : { startsAt: this.toDate(dto.startsAt) }),
      ...(dto.endsAt === undefined ? {} : { endsAt: this.toDate(dto.endsAt) }),
      ...(dto.tags === undefined ? {} : { tags: this.normalizeTags(dto.tags) }),
      ...(dto.description === undefined ? {} : { description: this.toNullableText(dto.description) }),
    };
  }

  private toProjectStatus(value: string): ProjectStatus {
    if (value === 'active') return ProjectStatus.ACTIVE;
    if (value === 'archived') return ProjectStatus.ARCHIVED;
    if (value === 'on_hold') return ProjectStatus.ON_HOLD;
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid project status'));
  }

  private toBillingType(value: string): BillingType {
    if (value === 'hourly') return BillingType.HOURLY;
    if (value === 'fixed') return BillingType.FIXED;
    if (value === 'retainer') return BillingType.RETAINER;
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid billing type'));
  }

  private toMemberRole(value: string): ProjectMemberRole {
    if (value === 'owner') return ProjectMemberRole.OWNER;
    if (value === 'viewer') return ProjectMemberRole.VIEWER;
    if (value === 'member') return ProjectMemberRole.MEMBER;
    throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid project member role'));
  }

  private parsePositiveInteger(value: string | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid pagination parameter'));
    }
    return parsed;
  }

  private requireName(value: string): string {
    const name = value.trim();
    if (name.length === 0) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Project name is required'));
    }
    return name;
  }

  private normalizeTags(tags: string[] | undefined): string[] {
    return (tags ?? [])
      .map((tag) => tag.trim())
      .filter((tag, index, all) => tag.length > 0 && all.indexOf(tag) === index);
  }

  private toDate(value: string | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(errorResponse('VALIDATION_ERROR', 'Invalid date value'));
    }
    return date;
  }

  private toNullableText(value: string | null | undefined): string | null {
    if (value === undefined || value === null) return null;
    const text = value.trim();
    return text.length === 0 ? null : text;
  }
}
