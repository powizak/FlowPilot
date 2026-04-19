export type ProjectStatus = 'active' | 'archived' | 'on_hold';
export type BillingType = 'hourly' | 'fixed' | 'retainer';

export interface Project {
  id: string;
  name: string;
  clientId: string | null;
  status: ProjectStatus;
  billingType: BillingType;
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
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: 'owner' | 'member';
  createdAt: Date;
}

export interface CreateProjectDto {
  name: string;
  clientId?: string | null;
  status?: ProjectStatus;
  billingType?: BillingType;
  budgetHours?: number | null;
  budgetAmount?: number | null;
  hourlyRateDefault?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  tags?: string[];
  description?: string | null;
}
