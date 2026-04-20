import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { EmailModule } from '../email/email.module.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoiceFromEntriesService } from './invoice-from-entries.service.js';
import { InvoiceLineItemsService } from './invoice-line-items.service.js';
import { InvoiceNumberingService } from './invoice-numbering.service.js';
import { InvoicePdfService } from './pdf/invoice-pdf.service.js';
import { InvoicesService } from './invoices.service.js';
import { SpaydService } from './spayd/spayd.service.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';

@Module({
  imports: [ActivityModule, SettingsModule, EmailModule, WebhooksModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceFromEntriesService,
    InvoiceLineItemsService,
    InvoiceNumberingService,
    InvoicePdfService,
    SpaydService,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
