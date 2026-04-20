import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoiceLineItemsService } from './invoice-line-items.service.js';
import { InvoiceNumberingService } from './invoice-numbering.service.js';
import { InvoicesService } from './invoices.service.js';
import { SpaydService } from './spayd/spayd.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceLineItemsService, InvoiceNumberingService, SpaydService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
