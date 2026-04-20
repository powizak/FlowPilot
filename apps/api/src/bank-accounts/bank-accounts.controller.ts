import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { BankAccountsService } from './bank-accounts.service.js';
import { CreateBankAccountDto } from './dto/create-bank-account.dto.js';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('api/bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll() {
    const accounts = await this.bankAccountsService.findAll();
    return { data: accounts };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const account = await this.bankAccountsService.findOne(id);
    return { data: account };
  }

  @Post()
  @Roles('ADMIN' as UserRole)
  async create(@Body() dto: CreateBankAccountDto) {
    const account = await this.bankAccountsService.create(dto);
    return { data: account };
  }

  @Put(':id')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    const account = await this.bankAccountsService.update(id, dto);
    return { data: account };
  }

  @Put(':id/default')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async setDefault(@Param('id') id: string) {
    const account = await this.bankAccountsService.setDefault(id);
    return { data: account };
  }

  @Delete(':id')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const account = await this.bankAccountsService.softDelete(id);
    return { data: account };
  }
}
