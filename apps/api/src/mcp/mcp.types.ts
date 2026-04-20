import type { AuthenticatedUser } from '../auth/auth.types.js';

export interface McpAuthenticatedUser extends AuthenticatedUser {
  apiKeyId: string;
  apiKeyName: string;
}
