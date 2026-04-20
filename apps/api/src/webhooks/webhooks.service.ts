import * as crypto from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WebhookDeliveryService } from './webhook-delivery.service.js';
import type { CreateWebhookDto } from './dto/create-webhook.dto.js';
import type { UpdateWebhookDto } from './dto/update-webhook.dto.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: WebhookDeliveryService,
  ) {}

  async list() {
    const webhooks = await this.prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: webhooks.map((w) => ({
        ...w,
        secret: this.maskSecret(w.secret),
      })),
    };
  }

  async create(dto: CreateWebhookDto) {
    const secret = dto.secret ?? crypto.randomBytes(32).toString('hex');
    const webhook = await this.prisma.webhook.create({
      data: {
        url: dto.url,
        secret,
        events: dto.events as never,
        isActive: dto.isActive ?? true,
      },
    });
    return { data: { ...webhook, secret: this.maskSecret(webhook.secret) } };
  }

  async update(id: string, dto: UpdateWebhookDto) {
    await this.getOrThrow(id);
    const webhook = await this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.secret !== undefined ? { secret: dto.secret } : {}),
        ...(dto.events !== undefined ? { events: dto.events as never } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    return { data: { ...webhook, secret: this.maskSecret(webhook.secret) } };
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.webhook.delete({ where: { id } });
    return { data: { success: true } };
  }

  async getDeliveries(webhookId: string) {
    await this.getOrThrow(webhookId);
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { data: deliveries };
  }

  async fire(event: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { isActive: true },
    });

    for (const webhook of webhooks) {
      const events = webhook.events as string[];
      if (!events.includes(event) && !events.includes('*')) continue;
      this.deliveryService
        .deliver(webhook.id, webhook.url, webhook.secret, event, payload)
        .catch((err) =>
          this.logger.warn(
            `Failed to queue delivery for webhook ${webhook.id}: ${err}`,
          ),
        );
    }
  }

  private async getOrThrow(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 8) return '********';
    return secret.slice(0, 4) + '****' + secret.slice(-4);
  }
}
