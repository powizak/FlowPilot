import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { MinioService } from './minio.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async upload(
    taskId: string,
    file: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    },
    user: AuthenticatedUser,
  ) {
    await this.ensureTaskExists(taskId);

    const storagePath = `${taskId}/${randomUUID()}-${file.originalname}`;
    await this.minio.upload(file.buffer, storagePath, file.mimetype);

    return this.prisma.attachment.create({
      data: {
        taskId,
        uploadedById: user.id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
      },
    });
  }

  async listByTask(taskId: string) {
    await this.ensureTaskExists(taskId);
    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getPresignedUrl(id: string) {
    const attachment = await this.findOrFail(id);
    const url = await this.minio.getPresignedUrl(attachment.storagePath);
    return {
      url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }

  async getPreviewUrl(id: string) {
    const attachment = await this.findOrFail(id);
    const url = await this.minio.getPresignedUrl(attachment.storagePath);
    return {
      url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      disposition: 'inline',
    };
  }

  async remove(id: string) {
    const attachment = await this.findOrFail(id);
    await this.minio.delete(attachment.storagePath);
    await this.prisma.attachment.delete({ where: { id } });
    return { success: true };
  }

  private async ensureTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
  }

  private async findOrFail(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }
}
