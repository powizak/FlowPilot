import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { errorResponse } from '../auth/auth.errors.js';
import type { McpAuthenticatedUser } from './mcp.types.js';
import { ApiKeyService } from './api-key.service.js';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | string[] | undefined>;
        user?: McpAuthenticatedUser;
      }>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (header === undefined || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        errorResponse('UNAUTHORIZED', 'API key required'),
      );
    }

    const rawKey = header.slice(7).trim();
    if (rawKey.length === 0) {
      throw new UnauthorizedException(
        errorResponse('UNAUTHORIZED', 'API key required'),
      );
    }

    request.user = await this.apiKeyService.authenticate(rawKey);
    return true;
  }
}
