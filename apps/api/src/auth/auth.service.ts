import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole as PrismaUserRole, type User as PrismaUser } from '@prisma/client';
import type { UserRole } from '@flowpilot/shared';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { errorResponse } from './auth.errors.js';
import type {
  AccessTokenPayload,
  LogoutApiResponse,
  RefreshTokenPayload,
  SanitizedUser,
  TokenApiResponse,
  TokenPair,
  UserApiResponse,
} from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RefreshDto } from './dto/refresh.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class AuthService {
  private readonly accessTokenTtl = '15m';
  private readonly refreshTokenTtl = '7d';
  private readonly refreshTokenTtlSeconds = 7 * 24 * 60 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<UserApiResponse> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser !== null) {
      throw new ConflictException(errorResponse('EMAIL_ALREADY_EXISTS', 'Email is already registered'));
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash: await hash(dto.password, 12),
      },
    });

    return { data: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto): Promise<TokenApiResponse> {
    const user = await this.validateCredentials(dto.email, dto.password);
    return { data: await this.issueTokenPair(user) };
  }

  async refresh(dto: RefreshDto): Promise<TokenApiResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const redisKey = this.refreshTokenKey(payload.sub, payload.jti);
    const storedTokenHash = await this.redis.get(redisKey);

    if (storedTokenHash !== this.hashToken(dto.refreshToken)) {
      throw new UnauthorizedException(
        errorResponse('REFRESH_TOKEN_INVALID', 'Refresh token is invalid or expired'),
      );
    }

    await this.redis.del(redisKey);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (user === null) {
      throw new UnauthorizedException(errorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    return { data: await this.issueTokenPair(user) };
  }

  async logout(dto: RefreshDto): Promise<LogoutApiResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    await this.redis.del(this.refreshTokenKey(payload.sub, payload.jti));

    return {
      data: {
        success: true,
      },
    };
  }

  async me(userId: string): Promise<UserApiResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user === null) {
      throw new UnauthorizedException(errorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    return { data: this.sanitizeUser(user) };
  }

  private async validateCredentials(email: string, password: string): Promise<PrismaUser> {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (user === null || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException(
        errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
      );
    }

    return user;
  }

  private async issueTokenPair(user: PrismaUser): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: this.toSharedRole(user.role),
      name: user.name,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: randomUUID(),
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.accessTokenTtl,
        secret: this.accessSecret,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: this.refreshTokenTtl,
        secret: this.refreshSecret,
      }),
    ]);

    await this.redis.set(
      this.refreshTokenKey(user.id, refreshPayload.jti),
      this.hashToken(refreshToken),
      this.refreshTokenTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new Error('Invalid refresh token payload type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        errorResponse('REFRESH_TOKEN_INVALID', 'Refresh token is invalid or expired'),
      );
    }
  }

  private sanitizeUser(user: PrismaUser): SanitizedUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      role: this.toSharedRole(user.role),
    };
  }

  private toSharedRole(role: PrismaUserRole): UserRole {
    switch (role) {
      case PrismaUserRole.ADMIN:
        return 'admin';
      case PrismaUserRole.VIEWER:
        return 'viewer';
      default:
        return 'member';
    }
  }

  private refreshTokenKey(userId: string, tokenId: string): string {
    return `auth:refresh:${userId}:${tokenId}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get accessSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? 'flowpilot-dev-access-secret';
  }

  private get refreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'flowpilot-dev-refresh-secret';
  }
}
