import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInvoiceLineItemDto } from './dto/create-invoice-line-item.dto.js';
import type { UpdateInvoiceLineItemDto } from './dto/update-invoice-line-item.dto.js';
import {
  assertDraft,
  computeLineItemTotal,
  getInvoiceDetailOrThrow,
  mapInvoice,
  recalculateInvoiceTotals,
} from './invoices.shared.js';

@Injectable()
export class InvoiceLineItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async add(invoiceId: string, dto: CreateInvoiceLineItemDto) {
    const invoice = await getInvoiceDetailOrThrow(this.prisma, invoiceId);
    assertDraft(invoice.status);

    await this.assertTask(dto.taskId, invoice.projectId);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.create({
        data: {
          invoiceId,
          taskId: dto.taskId ?? null,
          description: dto.description.trim(),
          quantity: dto.quantity,
          unit: dto.unit?.trim() || 'hod',
          unitPrice: dto.unitPrice,
          vatPercent: dto.vatPercent ?? 0,
          total: computeLineItemTotal(dto.quantity, dto.unitPrice),
          sortOrder: dto.sortOrder ?? invoice.lineItems.length,
        },
      });

      return recalculateInvoiceTotals(tx, invoiceId);
    });

    return { data: mapInvoice(updated) };
  }

  async update(invoiceId: string, lineItemId: string, dto: UpdateInvoiceLineItemDto) {
    const invoice = await getInvoiceDetailOrThrow(this.prisma, invoiceId);
    assertDraft(invoice.status);
    const lineItem = invoice.lineItems.find((item) => item.id === lineItemId);
    if (lineItem === undefined) {
      throw new NotFoundException('Invoice line item not found');
    }

    await this.assertTask(dto.taskId === undefined ? lineItem.taskId : dto.taskId, invoice.projectId);
    const quantity = dto.quantity ?? Number(lineItem.quantity);
    const unitPrice = dto.unitPrice ?? Number(lineItem.unitPrice);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.update({
        where: { id: lineItemId },
        data: {
          ...(dto.taskId === undefined ? {} : { taskId: dto.taskId ?? null }),
          ...(dto.description === undefined ? {} : { description: dto.description.trim() }),
          ...(dto.quantity === undefined ? {} : { quantity }),
          ...(dto.unit === undefined ? {} : { unit: dto.unit.trim() }),
          ...(dto.unitPrice === undefined ? {} : { unitPrice }),
          ...(dto.vatPercent === undefined ? {} : { vatPercent: dto.vatPercent }),
          ...(dto.sortOrder === undefined ? {} : { sortOrder: dto.sortOrder }),
          total: computeLineItemTotal(quantity, unitPrice),
        },
      });

      return recalculateInvoiceTotals(tx, invoiceId);
    });

    return { data: mapInvoice(updated) };
  }

  async remove(invoiceId: string, lineItemId: string) {
    const invoice = await getInvoiceDetailOrThrow(this.prisma, invoiceId);
    assertDraft(invoice.status);
    if (!invoice.lineItems.some((item) => item.id === lineItemId)) {
      throw new NotFoundException('Invoice line item not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.delete({ where: { id: lineItemId } });
      return recalculateInvoiceTotals(tx, invoiceId);
    });

    return { data: mapInvoice(updated) };
  }

  private async assertTask(taskId: string | null | undefined, invoiceProjectId: string | null) {
    if (taskId === undefined || taskId === null) {
      return;
    }

    const task = await this.prisma.task.findUnique({ where: { id: taskId }, select: { id: true, projectId: true } });
    if (task === null) {
      throw new NotFoundException('Task not found');
    }
    if (invoiceProjectId !== null && task.projectId !== invoiceProjectId) {
      throw new BadRequestException('Task does not belong to the invoice project');
    }
  }
}
