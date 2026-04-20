import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';

const DEFAULT_FORMAT = '{YYYY}-{SEQ:3}';

@Injectable()
export class InvoiceNumberingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async generate(issueDate: Date) {
    const format = await this.getFormat();
    const year = issueDate.getUTCFullYear();
    const month = String(issueDate.getUTCMonth() + 1).padStart(2, '0');
    const prefix = format
      .replaceAll('{YYYY}', String(year))
      .replaceAll('{MM}', month)
      .replace(/\{SEQ:\d+\}/g, '');

    const nextValue = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceNumberSequence.upsert({
        where: { prefix_year: { prefix, year } },
        create: { prefix, year, lastNumber: 0 },
        update: {},
      });

      const sequence = await tx.invoiceNumberSequence.update({
        where: { prefix_year: { prefix, year } },
        data: { lastNumber: { increment: 1 } },
        select: { lastNumber: true },
      });

      return sequence.lastNumber;
    });

    return format
      .replaceAll('{YYYY}', String(year))
      .replaceAll('{MM}', month)
      .replace(/\{SEQ:(\d+)\}/g, (_match, size: string) => String(nextValue).padStart(Number(size), '0'));
  }

  private async getFormat() {
    try {
      const value = await this.settingsService.get('invoice.numberFormat');
      return value.trim().length > 0 ? value : DEFAULT_FORMAT;
    } catch {
      return DEFAULT_FORMAT;
    }
  }
}
