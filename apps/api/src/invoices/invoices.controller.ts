import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { InvoiceLineItemsService } from './invoice-line-items.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { CreateInvoiceLineItemDto } from './dto/create-invoice-line-item.dto.js';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto.js';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { UpdateInvoiceLineItemDto } from './dto/update-invoice-line-item.dto.js';
import { InvoicesService } from './invoices.service.js';

@Controller('api/invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly lineItemsService: InvoiceLineItemsService,
  ) {}

  @Get()
  list(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.list(query);
  }

  @Post()
  @Roles('member' as UserRole, 'admin' as UserRole)
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Put(':id')
  @Roles('member' as UserRole, 'admin' as UserRole)
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('member' as UserRole, 'admin' as UserRole)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @Post(':id/line-items')
  @Roles('member' as UserRole, 'admin' as UserRole)
  addLineItem(@Param('id') id: string, @Body() dto: CreateInvoiceLineItemDto) {
    return this.lineItemsService.add(id, dto);
  }

  @Put(':id/line-items/:lineItemId')
  @Roles('member' as UserRole, 'admin' as UserRole)
  updateLineItem(
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: UpdateInvoiceLineItemDto,
  ) {
    return this.lineItemsService.update(id, lineItemId, dto);
  }

  @Delete(':id/line-items/:lineItemId')
  @Roles('member' as UserRole, 'admin' as UserRole)
  @HttpCode(HttpStatus.OK)
  removeLineItem(@Param('id') id: string, @Param('lineItemId') lineItemId: string) {
    return this.lineItemsService.remove(id, lineItemId);
  }

  @Post(':id/send')
  @Roles('member' as UserRole, 'admin' as UserRole)
  send(@Param('id') id: string) {
    return this.invoicesService.send(id);
  }

  @Post(':id/paid')
  @Roles('member' as UserRole, 'admin' as UserRole)
  markPaid(@Param('id') id: string, @Body() dto: MarkInvoicePaidDto) {
    return this.invoicesService.markPaid(id, dto);
  }

  @Post(':id/cancel')
  @Roles('member' as UserRole, 'admin' as UserRole)
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}
