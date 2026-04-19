export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
  avatarUrl?: string | null;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  passwordHash?: string;
  role?: UserRole;
  avatarUrl?: string | null;
}
