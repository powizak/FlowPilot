import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class AIUsageService {
  constructor(private readonly redisService: RedisService) {}

  async getMonthlyUsage(
    userId: string,
    date: Date = new Date(),
  ): Promise<number> {
    const value = await this.redisService.get(this.getUsageKey(userId, date));
    const parsed = Number(value ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async addUsage(
    userId: string,
    tokens: number,
    date: Date = new Date(),
  ): Promise<number> {
    const nextValue = (await this.getMonthlyUsage(userId, date)) + tokens;
    await this.redisService.set(
      this.getUsageKey(userId, date),
      String(nextValue),
      this.getTtlSeconds(date),
    );
    return nextValue;
  }

  async recordUsage(
    userId: string,
    tokens: number,
    date: Date = new Date(),
  ): Promise<void> {
    await this.addUsage(userId, tokens, date);
  }

  async getUsageSummary(
    userId: string,
    budget: number,
  ): Promise<{
    tokensUsed: number;
    budget: number;
    resetDate: string;
  }> {
    const now = new Date();
    return {
      tokensUsed: await this.getMonthlyUsage(userId, now),
      budget,
      resetDate: this.getResetDate(now).toISOString(),
    };
  }

  private getUsageKey(userId: string, date: Date): string {
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return `ai:usage:${userId}:${month}`;
  }

  private getResetDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );
  }

  private getTtlSeconds(date: Date): number {
    const ttlMs = this.getResetDate(date).getTime() - date.getTime();
    return Math.max(35 * 24 * 60 * 60, Math.ceil(ttlMs / 1000));
  }
}
