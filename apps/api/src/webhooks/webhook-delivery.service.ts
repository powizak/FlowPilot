import * as crypto from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 5_000;

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deliver(
    webhookId: string,
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as never,
        attemptCount: 0,
      },
    });

    this.attemptDelivery(delivery.id, url, body, signature, event, 0);
  }

  private attemptDelivery(
    deliveryId: string,
    url: string,
    body: string,
    signature: string,
    event: string,
    attempt: number,
  ): void {
    setImmediate(async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FlowPilot-Event': event,
            'X-FlowPilot-Signature': signature,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        const responseBody = await response.text().catch(() => '');

        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            statusCode: response.status,
            responseBody: responseBody.slice(0, 4096),
            attemptCount: attempt + 1,
            deliveredAt: response.ok ? new Date() : null,
            nextRetryAt:
              response.ok || attempt + 1 >= MAX_ATTEMPTS
                ? null
                : new Date(Date.now() + BACKOFF_BASE_MS * 2 ** attempt),
          },
        });

        if (!response.ok && attempt + 1 < MAX_ATTEMPTS) {
          const delay = BACKOFF_BASE_MS * 2 ** attempt;
          setTimeout(
            () =>
              this.attemptDelivery(
                deliveryId,
                url,
                body,
                signature,
                event,
                attempt + 1,
              ),
            delay,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Webhook delivery ${deliveryId} attempt ${attempt + 1} failed: ${err}`,
        );

        await this.prisma.webhookDelivery
          .update({
            where: { id: deliveryId },
            data: {
              attemptCount: attempt + 1,
              responseBody: String(err).slice(0, 4096),
              nextRetryAt:
                attempt + 1 >= MAX_ATTEMPTS
                  ? null
                  : new Date(Date.now() + BACKOFF_BASE_MS * 2 ** attempt),
            },
          })
          .catch(() => {});

        if (attempt + 1 < MAX_ATTEMPTS) {
          const delay = BACKOFF_BASE_MS * 2 ** attempt;
          setTimeout(
            () =>
              this.attemptDelivery(
                deliveryId,
                url,
                body,
                signature,
                event,
                attempt + 1,
              ),
            delay,
          );
        }
      }
    });
  }
}
