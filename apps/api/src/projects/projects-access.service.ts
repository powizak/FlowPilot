import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';
import { errorResponse } from '../auth/auth.errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AccessLevel, ProjectWithMembers } from './projects.shared.js';
import { projectInclude } from './projects.shared.js';

@Injectable()
export class ProjectsAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectWithAccess(
    projectId: string,
    user: AuthenticatedUser,
    accessLevel: AccessLevel,
  ): Promise<ProjectWithMembers> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });

    if (project === null) {
      throw new NotFoundException(errorResponse('PROJECT_NOT_FOUND', 'Project not found'));
    }

    if (this.isAdmin(user)) {
      return project;
    }

    const membership = project.members.find((member) => member.userId === user.id);
    if (membership === undefined) {
      throw new ForbiddenException(errorResponse('FORBIDDEN', 'Project access denied'));
    }

    if (accessLevel === 'write' && membership.role === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException(errorResponse('FORBIDDEN', 'Project write access denied'));
    }

    if (accessLevel === 'manage_members' && membership.role !== ProjectMemberRole.OWNER) {
      throw new ForbiddenException(errorResponse('FORBIDDEN', 'Project member management denied'));
    }

    return project;
  }

  assertCanCreate(user: AuthenticatedUser): void {
    if (user.role === 'viewer') {
      throw new ForbiddenException(errorResponse('FORBIDDEN', 'Insufficient role'));
    }
  }

  isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin';
  }
}
