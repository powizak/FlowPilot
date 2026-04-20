import {
  BillingType,
  ProjectMemberRole,
  ProjectStatus,
  UserRole as PrismaUserRole,
  type Prisma,
} from '@prisma/client';
import type {
  ApiBillingType,
  ApiProjectMemberRole,
  ApiProjectStatus,
  ProjectListItem,
  ProjectMemberView,
  ProjectStats,
  ProjectView,
} from './projects.types.js';

type ProjectRecord = Prisma.ProjectGetPayload<{
  include: {
    members: {
      include: {
        user: {
          select: { id: true; email: true; name: true; role: true };
        };
      };
    };
  };
}>;

type ProjectMemberRecord = ProjectRecord['members'][number];

export function toProjectView(project: ProjectRecord, stats?: ProjectStats): ProjectView {
  return {
    id: project.id,
    name: project.name,
    clientId: project.clientId,
    status: toApiProjectStatus(project.status),
    billingType: toApiBillingType(project.billingType),
    budgetHours: toNumber(project.budgetHours),
    budgetAmount: toNumber(project.budgetAmount),
    hourlyRateDefault: toNumber(project.hourlyRateDefault),
    startsAt: project.startsAt,
    endsAt: project.endsAt,
    tags: toTags(project.tags),
    description: project.description,
    deletedAt: project.deletedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    members: project.members.map(toProjectMemberView),
    ...(stats === undefined ? {} : { stats }),
  };
}

export function toProjectListItem(project: ProjectRecord, userId: string): ProjectListItem {
  const memberRole = project.members.find((member) => member.userId === userId)?.role;

  return {
    id: project.id,
    name: project.name,
    clientId: project.clientId,
    status: toApiProjectStatus(project.status),
    billingType: toApiBillingType(project.billingType),
    budgetHours: toNumber(project.budgetHours),
    budgetAmount: toNumber(project.budgetAmount),
    hourlyRateDefault: toNumber(project.hourlyRateDefault),
    startsAt: project.startsAt,
    endsAt: project.endsAt,
    tags: toTags(project.tags),
    description: project.description,
    deletedAt: project.deletedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    memberCount: project.members.length,
    memberRole: memberRole === undefined ? null : toApiProjectMemberRole(memberRole),
  };
}

export function toProjectMemberView(member: ProjectMemberRecord): ProjectMemberView {
  return {
    userId: member.userId,
    role: toApiProjectMemberRole(member.role),
    user: {
      id: member.user.id,
      email: member.user.email,
      name: member.user.name,
      role: toApiUserRole(member.user.role),
    },
  };
}

export function toApiProjectStatus(status: ProjectStatus): ApiProjectStatus {
  if (status === ProjectStatus.ARCHIVED) return 'archived';
  if (status === ProjectStatus.ON_HOLD) return 'on_hold';
  return 'active';
}

export function toApiBillingType(billingType: BillingType): ApiBillingType {
  if (billingType === BillingType.FIXED) return 'fixed';
  if (billingType === BillingType.RETAINER) return 'retainer';
  return 'hourly';
}

export function toApiProjectMemberRole(role: ProjectMemberRole): ApiProjectMemberRole {
  if (role === ProjectMemberRole.OWNER) return 'owner';
  if (role === ProjectMemberRole.VIEWER) return 'viewer';
  return 'member';
}

function toApiUserRole(role: PrismaUserRole): 'admin' | 'member' | 'viewer' {
  if (role === PrismaUserRole.ADMIN) return 'admin';
  if (role === PrismaUserRole.VIEWER) return 'viewer';
  return 'member';
}

export function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toTags(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
