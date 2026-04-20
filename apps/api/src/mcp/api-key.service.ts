import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { errorResponse } from '../auth/auth.errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import type { McpAuthenticatedUser } from './mcp.types.js';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const name = dto.name.trim();
    if (name.length === 0) {
      throw new BadRequestException(
        errorResponse('VALIDATION_ERROR', 'API key name is required'),
      );
    }

    const rawKey = randomBytes(32).toString('hex');
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        hashedKey: this.hashKey(rawKey),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });

    return {
      data: {
        ...apiKey,
        key: rawKey,
      },
    };
  }

  async list(userId: string) {
    const data = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });

    return { data };
  }

  async revoke(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
      select: { id: true, revokedAt: true },
    });

    if (apiKey === null) {
      throw new NotFoundException(
        errorResponse('API_KEY_NOT_FOUND', 'API key not found'),
      );
    }

    if (apiKey.revokedAt === null) {
      await this.prisma.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
    }

    return { data: { success: true } };
  }

  async authenticate(rawKey: string): Promise<McpAuthenticatedUser> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { hashedKey: this.hashKey(rawKey) },
      select: {
        id: true,
        name: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (apiKey === null || apiKey.revokedAt !== null) {
      throw new UnauthorizedException(
        errorResponse('UNAUTHORIZED', 'Invalid API key'),
      );
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: apiKey.user.id,
      email: apiKey.user.email,
      name: apiKey.user.name,
      role: apiKey.user.role.toLowerCase() as McpAuthenticatedUser['role'],
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
    };
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }
}
