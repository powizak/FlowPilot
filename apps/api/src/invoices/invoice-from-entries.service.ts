import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceNumberingService } from './invoice-numbering.service.js';
import { SpaydService } from './spayd/spayd.service.js';
import { type InvoiceFromEntriesDto } from './dto/invoice-from-entries.dto.js';
import {
  computeInvoiceTotals,
  computeLineItemTotal,
  invoiceDetailInclude,
  mapInvoice,
  parseDateBoundary,
  toNullableText,
} from './invoices.shared.js';

type SelectedEntry = {
  id: string;
  durationMinutes: number;
  workType: {
    id: string;
    name: string;
    hourlyRate: Prisma.Decimal;
  };
};

type PreparedInvoiceFromEntries = {
  clientId: string;
  projectId: string;
  bankAccountId: string | null;
  note: string | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatPercent: number;
    total: number;
  }>;
  entryIds: string[];
  totalHours: number;
  totalAmount: number;
  dueDate: Date;
  issueDate: Date;
};

@Injectable()
export class InvoiceFromEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: InvoiceNumberingService,
    private readonly spaydService: SpaydService,
  ) {}

  async preview(dto: InvoiceFromEntriesDto) {
    const prepared = await this.prepare(dto);
    return {
      lineItems: prepared.lineItems,
      totalHours: prepared.totalHours,
      totalAmount: prepared.totalAmount,
    };
  }

  async create(dto: InvoiceFromEntriesDto) {
    const prepared = await this.prepare(dto);
    if (prepared.entryIds.length === 0) {
      throw new BadRequestException('No unbilled time entries found for the selected filters');
    }

    const invoiceNumber = await this.numbering.generate(prepared.issueDate);
    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: prepared.clientId,
          projectId: prepared.projectId,
          bankAccountId: prepared.bankAccountId,
          issueDate: prepared.issueDate,
          dueDate: prepared.dueDate,
          taxPointDate: null,
          currency: 'CZK',
          exchangeRate: 1,
          discountPercent: 0,
          discountAmount: 0,
          vatPercent: 0,
          subtotal: prepared.totalAmount,
          vatAmount: 0,
          total: prepared.totalAmount,
          totalPaid: 0,
          note: prepared.note,
          lineItems: {
            create: prepared.lineItems.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              vatPercent: item.vatPercent,
              total: item.total,
              sortOrder: index,
            })),
          },
        },
        include: invoiceDetailInclude,
      });

      const updatedEntries = await tx.timeEntry.updateMany({
        where: { id: { in: prepared.entryIds }, invoiceId: null },
        data: { invoiceId: created.id },
      });

      if (updatedEntries.count !== prepared.entryIds.length) {
        throw new ConflictException('Some selected time entries were invoiced before invoice creation completed');
      }

      if (created.bankAccount !== null) {
        const spaydData = this.spaydService.buildSpaydData(created, created.bankAccount);
        const spaydString = this.spaydService.generateSpaydString(spaydData);
        await tx.invoice.update({
          where: { id: created.id },
          data: { qrCodeData: spaydString },
        });
        created.qrCodeData = spaydString;
      }

      return created;
    });

    return { data: mapInvoice(invoice) };
  }

  private async prepare(dto: InvoiceFromEntriesDto): Promise<PreparedInvoiceFromEntries> {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, deletedAt: null },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            deletedAt: true,
            defaultPaymentTermsDays: true,
            defaultInvoiceNote: true,
          },
        },
      },
    });

    if (project === null) {
      throw new NotFoundException('Project not found');
    }
    if (project.clientId === null || project.client === null || project.client.deletedAt !== null) {
      throw new BadRequestException('Project must have an active client before generating an invoice');
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: this.buildWhere(dto),
      select: {
        id: true,
        durationMinutes: true,
        workType: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: [{ workTypeId: 'asc' }, { startedAt: 'asc' }, { createdAt: 'asc' }],
    });

    const selectedEntries = entries.flatMap((entry) => {
      if (entry.durationMinutes === null || entry.workType === null) {
        return [];
      }

      return [{
        id: entry.id,
        durationMinutes: entry.durationMinutes,
        workType: entry.workType,
      } satisfies SelectedEntry];
    });

    const lineItems = this.buildLineItems(selectedEntries);
    const totals = computeInvoiceTotals(
      { discountPercent: 0, discountAmount: 0, vatPercent: 0 },
      lineItems.map((item) => ({ total: item.total })),
    );
    const totalMinutes = selectedEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + project.client.defaultPaymentTermsDays);
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: { id: true },
    });

    return {
      clientId: project.client.id,
      projectId: project.id,
      bankAccountId: bankAccount?.id ?? null,
      note: toNullableText(project.client.defaultInvoiceNote) ?? null,
      lineItems,
      entryIds: selectedEntries.map((entry) => entry.id),
      totalHours: this.toHours(totalMinutes),
      totalAmount: totals.total,
      dueDate,
      issueDate,
    };
  }

  private buildWhere(dto: InvoiceFromEntriesDto): Prisma.TimeEntryWhereInput {
    return {
      projectId: dto.projectId,
      invoiceId: null,
      isBillable: true,
      endedAt: { not: null },
      durationMinutes: { not: null },
      workTypeId:
        dto.workTypeIds === undefined
          ? { not: null }
          : { in: dto.workTypeIds },
      ...(dto.dateFrom === undefined && dto.dateTo === undefined
        ? {}
        : {
            startedAt: {
              ...(dto.dateFrom === undefined ? {} : { gte: parseDateBoundary(dto.dateFrom, 'start') }),
              ...(dto.dateTo === undefined ? {} : { lte: parseDateBoundary(dto.dateTo, 'end') }),
            },
          }),
    };
  }

  private buildLineItems(entries: SelectedEntry[]) {
    const groups = new Map<string, { name: string; hourlyRate: number; minutes: number }>();

    for (const entry of entries) {
      const current = groups.get(entry.workType.id) ?? {
        name: entry.workType.name,
        hourlyRate: Number(entry.workType.hourlyRate),
        minutes: 0,
      };
      current.minutes += entry.durationMinutes;
      groups.set(entry.workType.id, current);
    }

    return [...groups.values()]
      .sort((left, right) => left.name.localeCompare(right.name, 'cs'))
      .map((group) => {
        const quantity = this.toHours(group.minutes);
        return {
          description: group.name,
          quantity,
          unit: 'hod',
          unitPrice: group.hourlyRate,
          vatPercent: 0,
          total: computeLineItemTotal(quantity, group.hourlyRate),
        };
      });
  }

  private toHours(minutes: number) {
    return Math.round(((minutes / 60) + Number.EPSILON) * 1000) / 1000;
  }
}
