import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const invoiceListInclude = {
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  bankAccount: { select: { id: true, name: true, currency: true } },
  _count: { select: { lineItems: true } },
} as const;

export const invoiceDetailInclude = {
  client: true,
  project: { select: { id: true, name: true } },
  bankAccount: true,
  lineItems: {
    include: { task: { select: { id: true, name: true } } },
    orderBy: { sortOrder: 'asc' },
  },
} as const;

export type InvoiceListRecord = Prisma.InvoiceGetPayload<{ include: typeof invoiceListInclude }>;
export type InvoiceDetailRecord = Prisma.InvoiceGetPayload<{ include: typeof invoiceDetailInclude }>;

type InvoiceClient = Prisma.TransactionClient | Pick<Prisma.TransactionClient, 'invoice' | 'invoiceLineItem'>;

export const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const computeLineItemTotal = (quantity: number, unitPrice: number) =>
  roundCurrency(quantity * unitPrice);

export const computeInvoiceTotals = (
  invoice: {
    discountPercent: Prisma.Decimal | number;
    discountAmount: Prisma.Decimal | number;
    vatPercent: Prisma.Decimal | number;
  },
  lineItems: Array<{ total: Prisma.Decimal | number }>,
) => {
  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + Number(item.total), 0));
  const discountPercent = Number(invoice.discountPercent);
  const discountAmount = roundCurrency(
    discountPercent > 0 ? (subtotal * discountPercent) / 100 : Number(invoice.discountAmount),
  );
  const vatAmount = roundCurrency(((subtotal - discountAmount) * Number(invoice.vatPercent)) / 100);
  const total = roundCurrency(subtotal - discountAmount + vatAmount);

  return { subtotal, discountAmount, vatAmount, total };
};

export async function getInvoiceDetailOrThrow(client: Pick<InvoiceClient, 'invoice'>, id: string) {
  const invoice = await client.invoice.findUnique({
    where: { id },
    include: invoiceDetailInclude,
  });

  if (invoice === null) {
    throw new NotFoundException('Invoice not found');
  }

  return invoice;
}

export async function recalculateInvoiceTotals(client: InvoiceClient, invoiceId: string) {
  const invoice = await client.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, discountPercent: true, discountAmount: true, vatPercent: true },
  });

  if (invoice === null) {
    throw new NotFoundException('Invoice not found');
  }

  const lineItems = await client.invoiceLineItem.findMany({
    where: { invoiceId },
    select: { total: true },
  });
  const totals = computeInvoiceTotals(invoice, lineItems);

  return client.invoice.update({
    where: { id: invoiceId },
    data: totals,
    include: invoiceDetailInclude,
  });
}

export function assertDraft(status: string) {
  if (status !== 'DRAFT') {
    throw new ConflictException('Only draft invoices can be modified');
  }
}

export const mapInvoice = (invoice: InvoiceListRecord | InvoiceDetailRecord) => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  clientId: invoice.clientId,
  projectId: invoice.projectId,
  bankAccountId: invoice.bankAccountId,
  status: invoice.status,
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  taxPointDate: invoice.taxPointDate,
  currency: invoice.currency,
  exchangeRate: Number(invoice.exchangeRate),
  subtotal: Number(invoice.subtotal),
  discountPercent: Number(invoice.discountPercent),
  discountAmount: Number(invoice.discountAmount),
  vatPercent: Number(invoice.vatPercent),
  vatAmount: Number(invoice.vatAmount),
  total: Number(invoice.total),
  totalPaid: Number(invoice.totalPaid),
  paymentMethod: invoice.paymentMethod,
  qrCodeData: invoice.qrCodeData,
  note: invoice.note,
  footerNote: invoice.footerNote,
  pdfPath: invoice.pdfPath,
  sentAt: invoice.sentAt,
  paidAt: invoice.paidAt,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
  client: 'client' in invoice && invoice.client ? invoice.client : undefined,
  project: 'project' in invoice && invoice.project ? invoice.project : undefined,
  bankAccount:
    'bankAccount' in invoice && invoice.bankAccount
      ? {
          ...invoice.bankAccount,
          isDefault: 'isDefault' in invoice.bankAccount ? invoice.bankAccount.isDefault : undefined,
          isActive: 'isActive' in invoice.bankAccount ? invoice.bankAccount.isActive : undefined,
        }
      : undefined,
  lineItems:
    'lineItems' in invoice
      ? invoice.lineItems.map((item) => ({
          id: item.id,
          invoiceId: item.invoiceId,
          taskId: item.taskId,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          vatPercent: Number(item.vatPercent),
          total: Number(item.total),
          sortOrder: item.sortOrder,
          task: item.task,
        }))
      : undefined,
  lineItemsCount: '_count' in invoice ? invoice._count.lineItems : undefined,
});

export const parseDateBoundary = (value: string, boundary: 'start' | 'end') => {
  const date = new Date(value);
  if (boundary === 'start') {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

export const toNullableText = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const toNullableDate = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
};

export const toNumberOrNull = (value: number | null | undefined) =>
  value === undefined ? undefined : (value ?? null);
