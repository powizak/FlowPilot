import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import type { ListInvoicesQueryDto } from './dto/list-invoices-query.dto.js';
import type { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto.js';
import type { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { InvoiceNumberingService } from './invoice-numbering.service.js';
import { InvoiceFromEntriesDto } from './dto/invoice-from-entries.dto.js';
import { InvoiceFromEntriesService } from './invoice-from-entries.service.js';
import { SpaydService } from './spayd/spayd.service.js';
import { EmailService } from '../email/email.service.js';
import { InvoicePdfService } from './pdf/invoice-pdf.service.js';
import {
  assertDraft,
  getInvoiceDetailOrThrow,
  invoiceListInclude,
  mapInvoice,
  parseDateBoundary,
  recalculateInvoiceTotals,
  toNullableDate,
  toNullableText,
} from './invoices.shared.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: InvoiceNumberingService,
    private readonly spaydService: SpaydService,
    private readonly fromEntriesService: InvoiceFromEntriesService,
    private readonly emailService: EmailService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  async list(query: ListInvoicesQueryDto) {
    const where: Prisma.InvoiceWhereInput = {
      ...(query.status === undefined ? {} : { status: query.status as InvoiceStatus }),
      ...(query.clientId === undefined ? {} : { clientId: query.clientId }),
      ...(query.dateFrom === undefined && query.dateTo === undefined
        ? {}
        : {
            issueDate: {
              ...(query.dateFrom === undefined ? {} : { gte: parseDateBoundary(query.dateFrom, 'start') }),
              ...(query.dateTo === undefined ? {} : { lte: parseDateBoundary(query.dateTo, 'end') }),
            },
          }),
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: invoiceListInclude,
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data: data.map(mapInvoice), meta: { total, page, limit } };
  }

  async create(dto: CreateInvoiceDto) {
    await this.assertRelations(dto.clientId, dto.projectId, dto.bankAccountId);
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const invoiceNumber = await this.numbering.generate(issueDate);
    const data: Prisma.InvoiceUncheckedCreateInput = {
      invoiceNumber,
      clientId: dto.clientId,
      projectId: dto.projectId ?? null,
      bankAccountId: dto.bankAccountId ?? null,
      issueDate,
      dueDate: new Date(dto.dueDate),
      taxPointDate: dto.taxPointDate ? new Date(dto.taxPointDate) : null,
      currency: dto.currency?.trim() || 'CZK',
      exchangeRate: dto.exchangeRate ?? 1,
      discountPercent: dto.discountPercent ?? 0,
      discountAmount: dto.discountAmount ?? 0,
      vatPercent: dto.vatPercent ?? 0,
      ...(dto.paymentMethod === undefined ? {} : { paymentMethod: this.toPaymentMethod(dto.paymentMethod) }),
      note: toNullableText(dto.note) ?? null,
      footerNote: toNullableText(dto.footerNote) ?? null,
    };
    const invoice = await this.prisma.invoice.create({
      data,
      include: { client: true, project: { select: { id: true, name: true } }, bankAccount: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    if (invoice.bankAccount) {
      const spaydData = this.spaydService.buildSpaydData(invoice, invoice.bankAccount);
      const spaydString = this.spaydService.generateSpaydString(spaydData);
      invoice.qrCodeData = spaydString;
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { qrCodeData: spaydString },
      });
    }

    return { data: mapInvoice(invoice as never) };
  }

  async previewFromEntries(dto: InvoiceFromEntriesDto) {
    return this.fromEntriesService.preview(dto);
  }

  async createFromEntries(dto: InvoiceFromEntriesDto) {
    return this.fromEntriesService.create(dto);
  }

  async findOne(id: string) {
    return { data: mapInvoice(await getInvoiceDetailOrThrow(this.prisma, id)) };
  }

  async findOneWithBankAccount(id: string) {
    const invoice = await getInvoiceDetailOrThrow(this.prisma, id);
    return { data: mapInvoice(invoice) };
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await getInvoiceDetailOrThrow(this.prisma, id);
    assertDraft(existing.status);
    await this.assertRelations(dto.clientId ?? existing.clientId, dto.projectId ?? existing.projectId, dto.bankAccountId ?? existing.bankAccountId);
    const invoice = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.InvoiceUncheckedUpdateInput = {
        ...(dto.clientId === undefined ? {} : { clientId: dto.clientId }),
        ...(dto.projectId === undefined ? {} : { projectId: dto.projectId ?? null }),
        ...(dto.bankAccountId === undefined ? {} : { bankAccountId: dto.bankAccountId ?? null }),
        ...(dto.issueDate === undefined ? {} : { issueDate: new Date(dto.issueDate) }),
        ...(dto.dueDate === undefined ? {} : { dueDate: new Date(dto.dueDate) }),
        ...(dto.taxPointDate === undefined ? {} : { taxPointDate: toNullableDate(dto.taxPointDate) }),
        ...(dto.currency === undefined ? {} : { currency: dto.currency.trim() }),
        ...(dto.exchangeRate === undefined ? {} : { exchangeRate: dto.exchangeRate }),
        ...(dto.discountPercent === undefined ? {} : { discountPercent: dto.discountPercent }),
        ...(dto.discountAmount === undefined ? {} : { discountAmount: dto.discountAmount }),
        ...(dto.vatPercent === undefined ? {} : { vatPercent: dto.vatPercent }),
        ...(dto.totalPaid === undefined ? {} : { totalPaid: dto.totalPaid }),
        ...(dto.paymentMethod === undefined ? {} : { paymentMethod: this.toPaymentMethod(dto.paymentMethod) }),
        ...(dto.note === undefined ? {} : { note: toNullableText(dto.note) ?? null }),
        ...(dto.footerNote === undefined ? {} : { footerNote: toNullableText(dto.footerNote) ?? null }),
      };
      await tx.invoice.update({
        where: { id },
        data,
      });

      const updatedInvoice = await recalculateInvoiceTotals(tx, id);
      if (updatedInvoice.bankAccount) {
        const spaydData = this.spaydService.buildSpaydData(updatedInvoice, updatedInvoice.bankAccount);
        const spaydString = this.spaydService.generateSpaydString(spaydData);
        await tx.invoice.update({
          where: { id },
          data: { qrCodeData: spaydString },
        });
        updatedInvoice.qrCodeData = spaydString;
      }
      return updatedInvoice;
    });

    return { data: mapInvoice(invoice) };
  }

  async remove(id: string) {
    const existing = await getInvoiceDetailOrThrow(this.prisma, id);
    assertDraft(existing.status);
    await this.prisma.invoice.delete({ where: { id } });
    return { data: mapInvoice(existing) };
  }

  async send(id: string) {
    const existing = await getInvoiceDetailOrThrow(this.prisma, id);
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException('Only draft invoices can be sent');
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT, sentAt: new Date() },
      include: { client: true, project: { select: { id: true, name: true } }, bankAccount: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    if (invoice.client.email) {
      this.queueInvoiceEmail(invoice).catch(() => {});
    }

    return { data: mapInvoice(invoice as never) };
  }

  private async queueInvoiceEmail(invoice: {
    id: string;
    invoiceNumber: string;
    total: number | { toNumber?: () => number };
    currency: string;
    dueDate: Date;
    client: { name: string; email: string | null };
  }): Promise<void> {
    const recipientEmail = invoice.client.email;
    if (!recipientEmail) return;

    let pdfBuffer: Buffer | undefined;
    try {
      const result = await this.invoicePdfService.generate(invoice.id);
      pdfBuffer = result.buffer;
    } catch {
      /* PDF generation failed — send without attachment */
    }

    const total = typeof invoice.total === 'object' && invoice.total?.toNumber
      ? invoice.total.toNumber()
      : Number(invoice.total);

    const formatDate = (d: Date) =>
      `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

    await this.emailService.queueInvoiceEmail(
      invoice.id,
      recipientEmail,
      {
        companyName: 'FlowPilot',
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.name,
        total: new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2 }).format(total),
        currency: invoice.currency,
        dueDate: formatDate(invoice.dueDate),
      },
      pdfBuffer,
    );
  }

  async markPaid(id: string, dto: MarkInvoicePaidDto) {
    const existing = await getInvoiceDetailOrThrow(this.prisma, id);
    if (existing.status !== InvoiceStatus.SENT) {
      throw new ConflictException('Only sent invoices can be marked as paid');
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID, totalPaid: dto.totalPaid, paidAt: new Date() },
      include: { client: true, project: { select: { id: true, name: true } }, bankAccount: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    return { data: mapInvoice(invoice as never) };
  }

  async cancel(id: string) {
    await this.ensureInvoiceExists(id);
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
      include: { client: true, project: { select: { id: true, name: true } }, bankAccount: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    return { data: mapInvoice(invoice as never) };
  }

  private async assertRelations(clientId: string, projectId: string | null | undefined, bankAccountId: string | null | undefined) {
    const [client, project, bankAccount] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: clientId, deletedAt: null }, select: { id: true } }),
      projectId === undefined || projectId === null
        ? Promise.resolve(null)
        : this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, clientId: true } }),
      bankAccountId === undefined || bankAccountId === null
        ? Promise.resolve(null)
        : this.prisma.bankAccount.findUnique({ where: { id: bankAccountId }, select: { id: true, isActive: true } }),
    ]);

    if (client === null) {
      throw new NotFoundException('Client not found');
    }
    if (projectId !== undefined && projectId !== null) {
      if (project === null) throw new NotFoundException('Project not found');
      if (project.clientId !== null && project.clientId !== clientId) {
        throw new BadRequestException('Project does not belong to the selected client');
      }
    }
    if (bankAccountId !== undefined && bankAccountId !== null) {
      if (bankAccount === null) throw new NotFoundException('Bank account not found');
      if (!bankAccount.isActive) throw new BadRequestException('Bank account is inactive');
    }
  }

  private async ensureInvoiceExists(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, select: { id: true } });
    if (invoice === null) {
      throw new NotFoundException('Invoice not found');
    }
  }

  private toPaymentMethod(value: string): PaymentMethod {
    switch (value) {
      case 'BANK_TRANSFER':
        return PaymentMethod.BANK_TRANSFER;
      case 'CASH':
        return PaymentMethod.CASH;
      case 'CARD':
        return PaymentMethod.CARD;
      case 'OTHER':
        return PaymentMethod.OTHER;
      default:
        throw new BadRequestException('Invalid payment method');
    }
  }
}
