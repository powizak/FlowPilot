import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

const BUCKET = 'flowpilot-attachments';

@Injectable()
export class MinioService {
  private client: Minio.Client | null = null;
  private readonly logger = new Logger(MinioService.name);
  private ready = false;

  constructor() {
    try {
      this.client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT || 'minio',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: false,
        accessKey:
          process.env.MINIO_ACCESS_KEY ||
          process.env.MINIO_ROOT_USER ||
          'flowpilot',
        secretKey:
          process.env.MINIO_SECRET_KEY ||
          process.env.MINIO_ROOT_PASSWORD ||
          'flowpilot123',
      });
      this.ensureBucket();
    } catch (err) {
      this.logger.warn(
        'MinIO client init failed — file uploads disabled',
        (err as Error).message,
      );
    }
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) await this.client.makeBucket(BUCKET);
      this.ready = true;
    } catch (err) {
      this.logger.warn(
        'MinIO bucket check failed — file uploads disabled',
        (err as Error).message,
      );
    }
  }

  async upload(
    buffer: Buffer,
    storagePath: string,
    mimeType: string,
  ): Promise<void> {
    if (!this.client || !this.ready) {
      await this.ensureBucket();
    }
    if (!this.client) throw new Error('MinIO not available');
    await this.client.putObject(BUCKET, storagePath, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async getPresignedUrl(storagePath: string): Promise<string> {
    if (!this.client) throw new Error('MinIO not available');
    return this.client.presignedGetObject(BUCKET, storagePath, 3600);
  }

  async delete(storagePath: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.removeObject(BUCKET, storagePath);
    } catch (err) {
      this.logger.warn('MinIO delete failed', (err as Error).message);
    }
  }
}
