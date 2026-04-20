import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import QRCode from 'qrcode';

export interface SpaydData {
  iban: string;
  amount: string;
  currency: string;
  variableSymbol: string;
  dueDate: string;
  message: string;
}

@Injectable()
export class SpaydService {
  /**
   * Generate SPAYD string from invoice data per Czech payment standard.
   */
  generateSpaydString(data: SpaydData): string {
    const parts = [
      'SPD*1.0',
      `ACC:${data.iban}`,
      `AM:${data.amount}`,
      `CC:${data.currency}`,
      `VS:${data.variableSymbol}`,
      `DT:${data.dueDate}`,
      `MSG:${data.message}`,
    ];

    return parts.join('*');
  }

  /**
   * Generate QR code PNG buffer from SPAYD string.
   */
  async generateQrCode(spaydString: string): Promise<Buffer> {
    return this.generateQrCodeBuffer(spaydString);
  }

  /**
   * Generate QR code PNG buffer from SPAYD string.
   */
  async generateQrCodeBuffer(spaydString: string): Promise<Buffer> {
    return QRCode.toBuffer(spaydString, {
      errorCorrectionLevel: 'M',
      width: 300,
      type: 'png',
    });
  }

  /**
   * Extract variable symbol (digits only) from invoice number.
   * e.g., "2026-001" → "001", "FV-2025-15" → "202515"
   */
  extractVariableSymbol(invoiceNumber: string): string {
    return invoiceNumber.replace(/\D/g, '');
  }

  /**
   * Format date as YYYYMMDD.
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Truncate message to max 60 characters.
   */
  truncateMessage(message: string, maxLength = 60): string {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength - 3) + '...';
  }

  /**
   * Build SPAYD data from invoice and bank account.
   */
  buildSpaydData(invoice: {
    invoiceNumber: string;
    total: Prisma.Decimal;
    currency: string;
    dueDate: Date;
  }, bankAccount: {
    iban: string | null;
    accountNumber: string;
  }): SpaydData {
    const iban = bankAccount.iban || bankAccount.accountNumber;
    const amount = Number(invoice.total).toFixed(2);
    const variableSymbol = this.extractVariableSymbol(invoice.invoiceNumber);
    const dueDate = this.formatDate(invoice.dueDate);
    const message = this.truncateMessage(`Faktura ${invoice.invoiceNumber}`);

    return {
      iban,
      amount,
      currency: invoice.currency,
      variableSymbol,
      dueDate,
      message,
    };
  }
}
