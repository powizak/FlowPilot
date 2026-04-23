import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole, type Prisma } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AddProjectMemberDto } from './dto/add-project-member.dto.js';
import type { ProjectMemberResponse } from './projects.types.js';
import { ProjectsAccessService } from './projects-access.service.js';
import { toProjectMemberView } from './projects.mapper.js';

@Injectable()
export class ProjectsMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectsAccessService,
  ) {}

  async addMember(
    projectId: string,
    dto: AddProjectMemberDto,
    user: AuthenticatedUser,
  ): Promise<ProjectMemberResponse> {
    await this.access.getProjectWithAccess(projectId, user, 'manage_members');

    if (dto.userId === user.id && dto.role !== 'owner') {
      await this.ensureNotLastOwner(projectId, dto.userId);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (existingUser === null) {
      throw new NotFoundException(
        errorResponse('USER_NOT_FOUND', 'User not found'),
      );
    }

    const member = await this.prisma.projectMember.upsert({
      where: { userId_projectId: { userId: dto.userId, projectId } },
      update: { role: this.toMemberRole(dto.role) },
      create: {
        projectId,
        userId: dto.userId,
        role: this.toMemberRole(dto.role),
      },
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
  ): Promise<{ data: { success: boolean } }> {
    await this.access.getProjectWithAccess(projectId, user, 'manage_members');
    await this.ensureNotLastOwner(projectId, userId);

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { userId: true },
    });

    if (membership === null) {
      throw new NotFoundException(
        errorResponse('PROJECT_MEMBER_NOT_FOUND', 'Project member not found'),
      );
    }

    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    return { data: { success: true } };
  }

  async ensureNotLastOwner(projectId: string, userId: string): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true },
    });

    if (membership?.role !== ProjectMemberRole.OWNER) {
      return;
    }

    const ownerCount = await this.prisma.projectMember.count({
      where: { projectId, role: ProjectMemberRole.OWNER },
    });

    if (ownerCount <= 1) {
      throw new BadRequestException(
        errorResponse(
          'VALIDATION_ERROR',
          'Project must have at least one owner',
        ),
      );
    }
  }

  private toMemberRole(value: string): ProjectMemberRole {
    if (value === 'owner') return ProjectMemberRole.OWNER;
    if (value === 'viewer') return ProjectMemberRole.VIEWER;
    if (value === 'member') return ProjectMemberRole.MEMBER;
    throw new BadRequestException(
      errorResponse('VALIDATION_ERROR', 'Invalid project member role'),
    );
  }
}
