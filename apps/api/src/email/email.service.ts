import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import { SettingsService } from '../settings/settings.service.js';

export interface EmailJobData {
  type: 'invoice-sent' | 'payment-reminder';
  invoiceId: string;
  recipientEmail: string;
  pdfBuffer?: string;
  templateData: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly settingsService: SettingsService,
  ) {}

  async queueInvoiceEmail(
    invoiceId: string,
    recipientEmail: string,
    templateData: Record<string, unknown>,
    pdfBuffer?: Buffer,
  ): Promise<void> {
    await this.emailQueue.add('send-email', {
      type: 'invoice-sent',
      invoiceId,
      recipientEmail,
      pdfBuffer: pdfBuffer ? pdfBuffer.toString('base64') : undefined,
      templateData,
    } satisfies EmailJobData);
    this.logger.log(`Queued invoice-sent email for invoice ${invoiceId} to ${recipientEmail}`);
  }

  async queuePaymentReminder(
    invoiceId: string,
    recipientEmail: string,
    templateData: Record<string, unknown>,
    pdfBuffer?: Buffer,
  ): Promise<void> {
    await this.emailQueue.add('send-email', {
      type: 'payment-reminder',
      invoiceId,
      recipientEmail,
      pdfBuffer: pdfBuffer ? pdfBuffer.toString('base64') : undefined,
      templateData,
    } satisfies EmailJobData);
    this.logger.log(`Queued payment-reminder email for invoice ${invoiceId} to ${recipientEmail}`);
  }

  async sendEmail(data: EmailJobData): Promise<void> {
    const transporter = await this.createTransporter();
    if (!transporter) {
      this.logger.warn('SMTP not configured — skipping email send');
      return;
    }

    const html = this.renderTemplate(data.type, data.templateData);
    const fromName = await this.getSetting('email.fromName', 'FlowPilot');
    const fromEmail = await this.getSetting('email.fromEmail', 'noreply@flowpilot.cz');

    const subjectMap: Record<string, string> = {
      'invoice-sent': `Faktura ${data.templateData['invoiceNumber'] ?? data.invoiceId}`,
      'payment-reminder': `Upomínka k faktuře ${data.templateData['invoiceNumber'] ?? data.invoiceId}`,
    };

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (data.pdfBuffer) {
      const invoiceNumber = (data.templateData['invoiceNumber'] as string) ?? data.invoiceId;
      attachments.push({
        filename: `faktura-${invoiceNumber}.pdf`,
        content: Buffer.from(data.pdfBuffer, 'base64'),
      });
    }

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: data.recipientEmail,
      subject: subjectMap[data.type] ?? 'FlowPilot',
      html,
      attachments,
    });

    this.logger.log(`Email sent to ${data.recipientEmail} (type: ${data.type})`);
  }

  private async createTransporter(): Promise<Transporter | null> {
    const host = await this.getSetting('email.smtpHost');
    const port = await this.getSetting('email.smtpPort');
    if (!host || !port) return null;

    const user = await this.getSetting('email.smtpUser');
    const pass = await this.getSetting('email.smtpPass');

    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  private renderTemplate(templateName: string, data: Record<string, unknown>): string {
    let compiled = this.templateCache.get(templateName);
    if (!compiled) {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      const source = fs.readFileSync(templatePath, 'utf-8');
      compiled = Handlebars.compile(source);
      this.templateCache.set(templateName, compiled);
    }
    return compiled(data);
  }

  private async getSetting(key: string, fallback = ''): Promise<string> {
    try {
      return await this.settingsService.get(key);
    } catch {
      return fallback;
    }
  }
}
