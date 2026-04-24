import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Prisma, SettingValueType } from '@prisma/client';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const CACHE_KEY_PREFIX = 'settings:';
const CACHE_TTL = 3600; // 1 hour

const KNOWN_SETTING_TYPES: Record<string, SettingValueType> = {
  'app.name': 'STRING',
  'app.locale': 'STRING',
  'app.timezone': 'STRING',
  'app.currency': 'STRING',
  'company.name': 'STRING',
  'company.ic': 'STRING',
  'company.dic': 'STRING',
  'company.address': 'STRING',
  'company.email': 'STRING',
  'invoice.numberFormat': 'STRING',
  'invoice.defaultPaymentTermsDays': 'NUMBER',
  'invoice.defaultNote': 'STRING',
  'timeTracking.autoStopHours': 'NUMBER',
  'timeTracking.roundingMinutes': 'NUMBER',
  'timeTracking.defaultWorkTypeId': 'STRING',
  'project.defaults.hourlyRate': 'NUMBER',
  'project.defaults.currency': 'STRING',
  'project.defaults.defaultVatRate': 'NUMBER',
  'project.defaults.billableByDefault': 'BOOLEAN',
  'project.defaults.defaultWorkTypeId': 'STRING',
  'ai.preferredProvider': 'STRING',
  'ai.monthlyBudgetTokens': 'NUMBER',
  'ai.openai.enabled': 'BOOLEAN',
  'ai.openai.apiKey': 'STRING',
  'ai.openai.model': 'STRING',
  'ai.gemini.enabled': 'BOOLEAN',
  'ai.gemini.apiKey': 'STRING',
  'ai.gemini.model': 'STRING',
  'ai.openrouter.enabled': 'BOOLEAN',
  'ai.openrouter.apiKey': 'STRING',
  'ai.openrouter.model': 'STRING',
  'email.fromName': 'STRING',
  'email.fromEmail': 'STRING',
  'email.smtpHost': 'STRING',
  'email.smtpPort': 'NUMBER',
  'email.smtpUser': 'STRING',
  'email.smtpPass': 'STRING',
};

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
      case 'NUMBER': {
        const num = Number(value);
        if (Number.isNaN(num)) {
          return value;
        }
        return num;
      }
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

  private inferSettingType(key: string, value: string): SettingValueType {
    const knownType = KNOWN_SETTING_TYPES[key];
    if (knownType !== undefined) {
      return knownType;
    }

    if (value === 'true' || value === 'false') {
      return 'BOOLEAN';
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length > 0 && Number.isFinite(Number(trimmedValue))) {
      return 'NUMBER';
    }

    if (
      (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
      (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))
    ) {
      const parsedJson = (() => {
        try {
          return JSON.parse(trimmedValue) as unknown;
        } catch {
          return undefined;
        }
      })();

      if (parsedJson !== undefined) {
        return 'JSON';
      }
    }

    return 'STRING';
  }

  private async saveSetting(
    client: Prisma.TransactionClient | PrismaService,
    key: string,
    value: string,
  ): Promise<{ key: string; value: unknown; type: SettingValueType }> {
    const existing = await client.setting.findUnique({
      where: { key },
    });

    const persisted =
      existing === null
        ? await client.setting.create({
            data: {
              key,
              value,
              type: this.inferSettingType(key, value),
            },
          })
        : await client.setting.update({
            where: { key },
            data: { value },
          });

    await this.invalidateCache(key);

    return {
      key: persisted.key,
      value: this.coerceValue(persisted.value, persisted.type),
      type: persisted.type,
    };
  }

  async findAll(): Promise<
    Array<{ key: string; value: unknown; type: SettingValueType }>
  > {
    const settings = await this.prismaService.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map((setting) => ({
      key: setting.key,
      value: this.coerceValue(setting.value, setting.type),
      type: setting.type,
    }));
  }

  async findOne(
    key: string,
  ): Promise<{ key: string; value: unknown; type: SettingValueType }> {
    const cached = await this.getFromCache(key);
    if (cached !== null) {
      const setting = await this.prismaService.setting.findUnique({
        where: { key },
      });
      if (!setting) {
        throw new NotFoundException({
          message: `Setting with key "${key}" not found`,
        });
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
      throw new NotFoundException({
        message: `Setting with key "${key}" not found`,
      });
    }

    await this.setCache(key, setting.value);

    return {
      key: setting.key,
      value: this.coerceValue(setting.value, setting.type),
      type: setting.type,
    };
  }

  async get(key: string): Promise<string> {
    const cached = await this.getFromCache(key);
    if (cached !== null) {
      return cached;
    }

    const setting = await this.prismaService.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException({
        message: `Setting with key "${key}" not found`,
      });
    }

    await this.setCache(key, setting.value);
    return setting.value;
  }

  async update(
    key: string,
    value: string,
  ): Promise<{ key: string; value: unknown; type: SettingValueType }> {
    return this.saveSetting(this.prismaService, key, value);
  }

  async bulkUpdate(
    updates: Array<{ key: string; value: string }>,
  ): Promise<Array<{ key: string; value: unknown; type: SettingValueType }>> {
    return this.prismaService.$transaction(async (tx) => {
      const results = [];

      for (const { key, value } of updates) {
        results.push(await this.saveSetting(tx, key, value));
      }

      return results;
    });
  }
}
