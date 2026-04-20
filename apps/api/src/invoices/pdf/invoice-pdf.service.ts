import { PassThrough } from 'node:stream';
import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsService } from '../../settings/settings.service.js';
import { SpaydService } from '../spayd/spayd.service.js';
import type { InvoiceDetailRecord } from '../invoices.shared.js';
import { getInvoiceDetailOrThrow } from '../invoices.shared.js';

const MARGIN = 40;
const FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const formatMoney = (value: number, currency: string) =>
  `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
const formatQuantity = (value: number) =>
  new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value);
const formatDate = (d: Date) =>
  `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

@Injectable()
export class InvoicePdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly spaydService: SpaydService,
  ) {}

  async generate(invoiceId: string) {
    const invoice = await getInvoiceDetailOrThrow(this.prisma, invoiceId);
    const supplier = await this.getSupplierInfo();
    const qrCode = await this.getQrCode(invoice);
    return {
      buffer: await this.render(invoice, supplier, qrCode),
      fileName: `faktura-${invoice.invoiceNumber}.pdf`,
      pdfPath: invoice.pdfPath,
      stored: false,
    };
  }

  async warmup(invoiceId: string) {
    await this.generate(invoiceId);
  }

  private async getSupplierInfo() {
    const [name, ic, dic, address, email] = await Promise.all([
      this.getSetting('company.name', 'FlowPilot'),
      this.getSetting('company.ic'),
      this.getSetting('company.dic'),
      this.getSetting('company.address'),
      this.getSetting('company.email'),
    ]);
    return { name, ic, dic, address, email };
  }

  private async getSetting(key: string, fallback = '') {
    try {
      return await this.settingsService.get(key);
    } catch {
      return fallback;
    }
  }

  private async getQrCode(invoice: InvoiceDetailRecord) {
    if (!invoice.bankAccount) return null;
    const spaydString =
      invoice.qrCodeData ??
      this.spaydService.generateSpaydString(this.spaydService.buildSpaydData(invoice, invoice.bankAccount));
    return this.spaydService.generateQrCode(spaydString);
  }

  private async render(
    invoice: InvoiceDetailRecord,
    supplier: { name: string; ic: string; dic: string; address: string; email: string },
    qrCode: Buffer | null,
  ) {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, compress: true });
    doc.registerFont('regular', FONT_REGULAR);
    doc.registerFont('bold', FONT_BOLD);
    doc.font('regular');

    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.pipe(stream);

    const contentWidth = doc.page.width - MARGIN * 2;
    this.renderHeader(doc, invoice, contentWidth);
    this.renderPartyBoxes(doc, invoice, supplier, contentWidth);
    this.renderDates(doc, invoice, contentWidth);
    this.renderTable(doc, invoice, contentWidth);
    this.renderTotals(doc, invoice, contentWidth);
    this.renderPaymentInfo(doc, invoice, contentWidth);
    this.renderFooter(doc, invoice, qrCode, contentWidth);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', reject);
      doc.on('error', reject);
    });

    return Buffer.concat(chunks);
  }

  private renderHeader(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, width: number) {
    doc.font('bold').fontSize(24).text('FAKTURA', MARGIN, MARGIN);
    doc.font('regular').fontSize(11).text(`Číslo: ${invoice.invoiceNumber}`, MARGIN + width - 180, MARGIN, { width: 180, align: 'right' });
    doc.text(`Stav: ${invoice.status}`, MARGIN + width - 180, MARGIN + 18, { width: 180, align: 'right' });
    doc.y = 82;
  }

  private renderPartyBoxes(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceDetailRecord,
    supplier: { name: string; ic: string; dic: string; address: string; email: string },
    width: number,
  ) {
    const top = doc.y;
    const boxWidth = (width - 16) / 2;
    this.renderBox(doc, MARGIN, top, boxWidth, 'Dodavatel', [
      supplier.name,
      supplier.ic ? `IČO: ${supplier.ic}` : '',
      supplier.dic ? `DIČ: ${supplier.dic}` : 'DIČ: -',
      ...this.linesFromValue(supplier.address),
      supplier.email ? `E-mail: ${supplier.email}` : '',
    ]);
    this.renderBox(doc, MARGIN + boxWidth + 16, top, boxWidth, 'Odběratel', [
      invoice.client.name,
      invoice.client.ic ? `IČO: ${invoice.client.ic}` : '',
      invoice.client.dic ? `DIČ: ${invoice.client.dic}` : 'DIČ: -',
      ...this.linesFromValue(invoice.client.billingAddress),
      invoice.client.email ? `E-mail: ${invoice.client.email}` : '',
    ]);
    doc.y = top + 116;
  }

  private renderBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, title: string, lines: string[]) {
    doc.roundedRect(x, y, width, 108, 6).lineWidth(1).stroke('#d1d5db');
    doc.font('bold').fontSize(11).text(title, x + 10, y + 10, { width: width - 20 });
    doc.font('regular').fontSize(10).text(lines.filter(Boolean).join('\n'), x + 10, y + 28, { width: width - 20, lineGap: 1 });
  }

  private renderDates(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, width: number) {
    const startY = doc.y + 2;
    const itemWidth = width / 3;
    [
      ['Datum vystavení', formatDate(invoice.issueDate)],
      ['Datum splatnosti', formatDate(invoice.dueDate)],
      ['DUZP', formatDate(invoice.taxPointDate ?? invoice.issueDate)],
    ].forEach(([label, value], index) => {
      const x = MARGIN + itemWidth * index;
      doc.font('bold').fontSize(10).text(label, x, startY, { width: itemWidth - 8 });
      doc.font('regular').text(value, x, startY + 14, { width: itemWidth - 8 });
    });
    doc.y = startY + 34;
  }

  private renderTable(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, width: number) {
    const columns = [20, 190, 45, 35, 70, 35, 70];
    const headers = ['#', 'Popis', 'Qty', 'Jed', 'Cena', 'DPH', 'Celkem'];
    let y = doc.y + 8;
    const drawHeader = () => {
      let x = MARGIN;
      doc.font('bold').fontSize(9);
      headers.forEach((header, index) => {
        doc.text(header, x + 4, y + 4, { width: columns[index] - 8, align: index === 1 ? 'left' : 'right' });
        x += columns[index];
      });
      doc.moveTo(MARGIN, y + 18).lineTo(MARGIN + width, y + 18).stroke('#9ca3af');
      y += 22;
    };
    drawHeader();

    invoice.lineItems.forEach((item, index) => {
      const rowHeight = Math.max(20, doc.heightOfString(item.description, { width: columns[1] - 8 }) + 8);
      if (y + rowHeight > doc.page.height - 220) {
        doc.addPage({ size: 'A4', margin: MARGIN });
        doc.font('regular');
        y = MARGIN;
        drawHeader();
      }
      let x = MARGIN;
      const cells = [
        String(index + 1),
        item.description,
        formatQuantity(Number(item.quantity)),
        item.unit,
        formatMoney(Number(item.unitPrice), invoice.currency),
        `${item.vatPercent.toFixed(0)} %`,
        formatMoney(Number(item.total), invoice.currency),
      ];
      doc.font('regular').fontSize(9);
      cells.forEach((cell, cellIndex) => {
        doc.text(cell, x + 4, y + 4, {
          width: columns[cellIndex] - 8,
          align: cellIndex === 1 ? 'left' : 'right',
        });
        x += columns[cellIndex];
      });
      doc.moveTo(MARGIN, y + rowHeight).lineTo(MARGIN + width, y + rowHeight).stroke('#e5e7eb');
      y += rowHeight;
    });
    doc.y = y + 6;
  }

  private renderTotals(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, width: number) {
    const x = MARGIN + width - 190;
    const rows: Array<[string, string, boolean]> = [
      ['Mezisoučet', formatMoney(Number(invoice.subtotal), invoice.currency), false],
      ['Sleva', formatMoney(Number(invoice.discountAmount), invoice.currency), false],
      ['DPH', formatMoney(Number(invoice.vatAmount), invoice.currency), false],
      ['Celkem', formatMoney(Number(invoice.total), invoice.currency), true],
    ];
    rows.forEach(([label, value, bold]) => {
      doc.font(bold ? 'bold' : 'regular').fontSize(bold ? 12 : 10);
      const y = doc.y;
      doc.text(label, x, y, { width: 80 });
      doc.text(value, x + 80, y, { width: 110, align: 'right' });
      doc.moveDown(bold ? 0.6 : 0.4);
    });
    if (invoice.note) {
      doc.moveDown(0.3);
      doc.font('bold').fontSize(10).text('Poznámka');
      doc.font('regular').fontSize(9).text(invoice.note);
    }
  }

  private renderPaymentInfo(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, width: number) {
    if (doc.y > doc.page.height - 220) {
      doc.addPage({ size: 'A4', margin: MARGIN });
      doc.font('regular');
    }
    const variableSymbol = this.spaydService.extractVariableSymbol(invoice.invoiceNumber);
    const paymentTop = doc.y + 10;
    doc.font('bold').fontSize(11).text('Platební údaje', MARGIN, paymentTop);
    doc.font('regular').fontSize(10).text(
      [
        `IBAN / účet: ${invoice.bankAccount?.iban ?? invoice.bankAccount?.accountNumber ?? '-'}`,
        `Variabilní symbol: ${variableSymbol || '-'}`,
        `Splatnost: ${formatDate(invoice.dueDate)}`,
        `Měna: ${invoice.currency}`,
      ].join('\n'),
      MARGIN,
      paymentTop + 18,
      { width: width - 160, lineGap: 2 },
    );
    doc.y = paymentTop + 84;
  }

  private renderFooter(doc: PDFKit.PDFDocument, invoice: InvoiceDetailRecord, qrCode: Buffer | null, width: number) {
    const qrSize = 120;
    const qrX = MARGIN + width - qrSize;
    const qrY = doc.page.height - MARGIN - qrSize - 22;
    if (invoice.footerNote) {
      doc.font('regular').fontSize(9).text(invoice.footerNote, MARGIN, qrY - 24, { width: width - qrSize - 16 });
    }
    if (qrCode) {
      doc.image(qrCode, qrX, qrY, { width: qrSize });
    }
    doc.font('regular').fontSize(8).fillColor('#6b7280').text(
      'Doklad obsahuje povinné údaje dle §29 zákona o DPH: IČO, DIČ, datum vystavení, DUZP, popis plnění, částku a měnu.',
      MARGIN,
      doc.page.height - MARGIN - 10,
      { width: width - 130 },
    );
    doc.fillColor('black');
  }

  private linesFromValue(value: unknown) {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    }
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .filter((part): part is string => typeof part === 'string')
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [String(value)];
  }
}
