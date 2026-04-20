import type { UserRole } from '@flowpilot/shared';

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
