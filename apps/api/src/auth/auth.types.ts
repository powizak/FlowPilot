import type { ApiResponse, User, UserRole } from '@flowpilot/shared';

export type SanitizedUser = Omit<User, 'passwordHash'>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type UserApiResponse = ApiResponse<SanitizedUser>;
export type TokenApiResponse = ApiResponse<TokenPair>;
export type LogoutApiResponse = ApiResponse<{ success: true }>;
