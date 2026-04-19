import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Setting, SettingValueType } from '@prisma/client';

const CACHE_KEY_PREFIX = 'settings:';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Warm up cache with all settings
    await this.warmCache();
  }

  private async warmCache(): Promise<void> {
    const settings = await this.prismaService.setting.findMany();
    for (const setting of settings) {
      await this.redisService.set(
        this.getCacheKey(setting.key),
        setting.value,
        CACHE_TTL,
      );
    }
  }

  private getCacheKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`;
  }

  private async getFromCache(key: string): Promise<string | null> {
    return this.redisService.get(this.getCacheKey(key));
  }

  private async setCache(key: string, value: string): Promise<void> {
    await this.redisService.set(this.getCacheKey(key), value, CACHE_TTL);
  }

  private async invalidateCache(key: string): Promise<void> {
    await this.redisService.del(this.getCacheKey(key));
  }

  private coerceValue(value: string, type: SettingValueType): unknown {
    switch (type) {
      case 'NUMBER':
        const num = Number(value);
        if (Number.isNaN(num)) {
          return value;
        }
        return num;
      case 'BOOLEAN':
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'STRING':
      default:
        return value;
    }
  }

  async findAll(): Promise<Array<{ key: string; value: unknown; type: SettingValueType }>> {
    const settings = await this.prismaService.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map((setting) => ({
      key: setting.key,
      value: this.coerceValue(setting.value, setting.type),
      type: setting.type,
    }));
  }

  async findOne(key: string): Promise<{ key: string; value: unknown; type: SettingValueType }> {
    const cached = await this.getFromCache(key);
    if (cached !== null) {
      const setting = await this.prismaService.setting.findUnique({
        where: { key },
      });
      if (!setting) {
        throw new NotFoundException({ message: `Setting with key "${key}" not found` });
      }
      return {
        key: setting.key,
        value: this.coerceValue(cached, setting.type),
        type: setting.type,
      };
    }

    const setting = await this.prismaService.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException({ message: `Setting with key "${key}" not found` });
    }

    await this.setCache(key, setting.value);

    return {
      key: setting.key,
      value: this.coerceValue(setting.value, setting.type),
      type: setting.type,
    };
  }

  async update(
    key: string,
    value: string,
  ): Promise<{ key: string; value: unknown; type: SettingValueType }> {
    const setting = await this.prismaService.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException({ message: `Setting with key "${key}" not found` });
    }

    const updated = await this.prismaService.setting.update({
      where: { key },
      data: { value },
    });

    await this.invalidateCache(key);

    return {
      key: updated.key,
      value: this.coerceValue(updated.value, updated.type),
      type: updated.type,
    };
  }

  async bulkUpdate(
    updates: Array<{ key: string; value: string }>,
  ): Promise<Array<{ key: string; value: unknown; type: SettingValueType }>> {
    const results = [];

    for (const { key, value } of updates) {
      const setting = await this.prismaService.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        throw new NotFoundException({ message: `Setting with key "${key}" not found` });
      }

      const updated = await this.prismaService.setting.update({
        where: { key },
        data: { value },
      });

      await this.invalidateCache(key);

      results.push({
        key: updated.key,
        value: this.coerceValue(updated.value, updated.type),
        type: updated.type,
      });
    }

    return results;
  }
}