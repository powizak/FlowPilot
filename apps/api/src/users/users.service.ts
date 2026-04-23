import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole as PrismaUserRole } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';
import type { UserRole } from '@flowpilot/shared';
import * as Minio from 'minio';
import { parseMinioEndpoint } from '../common/minio-endpoint.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SanitizedUser, PaginationMeta } from './users.types.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  private minioClient: Minio.Client | null = null;
  private readonly logger = new Logger(UsersService.name);
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'flowpilot';
    try {
      const { endPoint, port, useSSL } = parseMinioEndpoint(
        this.config.get<string>('MINIO_ENDPOINT'),
        Number(this.config.get<string>('MINIO_PORT') ?? '9000'),
      );
      this.minioClient = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? '',
        secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? '',
      });
    } catch (err) {
      this.logger.warn(
        `MinIO client init failed — avatar uploads disabled: ${(err as Error).message}`,
      );
    }
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: SanitizedUser[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => this.sanitize(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SanitizedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<SanitizedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = requesterRole === 'admin';
    const isSelf = requesterId === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (dto.role !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can change roles');
    }

    const data: Record<string, unknown> = {};
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.role !== undefined) data.role = this.toPrismaRole(dto.role);

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.sanitize(updated);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  async getProfile(userId: string): Promise<SanitizedUser> {
    return this.findOne(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SanitizedUser> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.avatarUrl !== undefined) {
      const raw = dto.avatarUrl;
      data.avatarUrl =
        typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitize(updated);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!this.minioClient) {
      throw new ServiceUnavailableException('File storage unavailable');
    }
    const client = this.minioClient;
    const ext = file.originalname.split('.').pop() ?? 'png';
    const objectName = `avatars/${userId}.${ext}`;

    await this.ensureBucket();
    await client.putObject(this.bucket, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const { endPoint, port } = parseMinioEndpoint(
      this.config.get<string>('MINIO_ENDPOINT'),
      Number(this.config.get<string>('MINIO_PORT') ?? '9000'),
    );
    const avatarUrl = `http://${endPoint}:${port}/${this.bucket}/${objectName}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  private async ensureBucket(): Promise<void> {
    if (!this.minioClient) return;
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  private sanitize(user: PrismaUser): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: this.toSharedRole(user.role),
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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

  private toPrismaRole(role: UserRole): PrismaUserRole {
    switch (role) {
      case 'admin':
        return PrismaUserRole.ADMIN;
      case 'viewer':
        return PrismaUserRole.VIEWER;
      default:
        return PrismaUserRole.MEMBER;
    }
  }
}
