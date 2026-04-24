import type {
  ApiResponse,
  PaginatedResponse,
  UserRole,
} from '@flowpilot/shared';

export type ApiProjectStatus = 'active' | 'archived' | 'on_hold';
export type ApiBillingType = 'hourly' | 'fixed' | 'retainer';
export type ApiProjectMemberRole = 'owner' | 'member' | 'viewer';

export interface ProjectStats {
  budgetHours: number | null;
  actualHours: number;
  hoursVariance: number | null;
  budgetAmount: number | null;
  actualAmount: number;
  amountVariance: number | null;
  totalTasks: number;
  completedTasks: number;
  taskCompletionPercent: number;
}

export interface ProjectMemberView {
  userId: string;
  role: ApiProjectMemberRole;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface ProjectView {
  id: string;
  name: string;
  clientId: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  status: ApiProjectStatus;
  billingType: ApiBillingType;
  currency: string;
  defaultVatPercent: number | null;
  budgetHours: number | null;
  budgetAmount: number | null;
  hourlyRateDefault: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  tags: string[];
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMemberView[];
  stats?: ProjectStats;
}

export interface ProjectListItem extends Omit<
  ProjectView,
  'members' | 'stats'
> {
  memberCount: number;
  memberRole: ApiProjectMemberRole | null;
  totalTasks: number;
  completedTasks: number;
}

export type ProjectResponse = ApiResponse<ProjectView>;
export type ProjectStatsResponse = ApiResponse<ProjectStats>;
export type ProjectMemberResponse = ApiResponse<ProjectMemberView>;
export type RemoveProjectMemberResponse = ApiResponse<{ success: true }>;
export type ProjectsListResponse = PaginatedResponse<ProjectListItem>;
