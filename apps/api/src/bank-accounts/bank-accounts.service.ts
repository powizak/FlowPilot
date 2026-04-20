import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBankAccountDto } from './dto/create-bank-account.dto.js';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto.js';
import type { BankAccount } from '@flowpilot/shared';
import type { BankAccount as PrismaBankAccount } from '@prisma/client';

const IBAN_REGEX = /^[A-Z]{2}[A-Z0-9]{13,32}$/;

@Injectable()
export class BankAccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  private toBankAccount(ba: PrismaBankAccount): BankAccount {
    return {
      id: ba.id,
      name: ba.name,
      bankName: ba.bankName,
      accountNumber: ba.accountNumber,
      iban: ba.iban,
      swift: ba.swift,
      currency: ba.currency,
      isDefault: ba.isDefault,
      isActive: ba.isActive,
    };
  }

  private validateIban(iban: string): void {
    if (!IBAN_REGEX.test(iban)) {
      throw new BadRequestException({
        message: 'IBAN must be alphanumeric, 15-34 characters, and start with 2 letters',
      });
    }
  }

  private async clearDefaultForCurrency(currency: string, excludeId?: string): Promise<void> {
    await this.prismaService.bankAccount.updateMany({
      where: {
        currency,
        isDefault: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  async findAll(): Promise<BankAccount[]> {
    const accounts = await this.prismaService.bankAccount.findMany({
      where: { isActive: true },
      orderBy: [{ currency: 'asc' }, { name: 'asc' }],
    });
    return accounts.map((ba) => this.toBankAccount(ba));
  }

  async findOne(id: string): Promise<BankAccount> {
    const account = await this.prismaService.bankAccount.findUnique({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException({ message: `Bank account with id "${id}" not found` });
    }
    return this.toBankAccount(account);
  }

  async create(dto: CreateBankAccountDto): Promise<BankAccount> {
    if (dto.iban) {
      this.validateIban(dto.iban);
    }

    if (dto.isDefault) {
      await this.clearDefaultForCurrency(dto.currency ?? 'CZK');
    }

    const account = await this.prismaService.bankAccount.create({
      data: {
        name: dto.name,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        iban: dto.iban,
        swift: dto.swift,
        currency: dto.currency ?? 'CZK',
        isDefault: dto.isDefault ?? false,
        isActive: true,
      },
    });
    return this.toBankAccount(account);
  }

  async update(id: string, dto: UpdateBankAccountDto): Promise<BankAccount> {
    const existing = await this.prismaService.bankAccount.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Bank account with id "${id}" not found` });
    }

    if (dto.iban) {
      this.validateIban(dto.iban);
    }

    if (dto.isDefault && !existing.isDefault) {
      await this.clearDefaultForCurrency(dto.currency ?? existing.currency, id);
    }

    const account = await this.prismaService.bankAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.iban !== undefined && { iban: dto.iban }),
        ...(dto.swift !== undefined && { swift: dto.swift }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.toBankAccount(account);
  }

  async setDefault(id: string): Promise<BankAccount> {
    const existing = await this.prismaService.bankAccount.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Bank account with id "${id}" not found` });
    }

    await this.clearDefaultForCurrency(existing.currency, id);

    const account = await this.prismaService.bankAccount.update({
      where: { id },
      data: { isDefault: true },
    });
    return this.toBankAccount(account);
  }

  async softDelete(id: string): Promise<BankAccount> {
    const existing = await this.prismaService.bankAccount.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Bank account with id "${id}" not found` });
    }

    const account = await this.prismaService.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });
    return this.toBankAccount(account);
  }
}
