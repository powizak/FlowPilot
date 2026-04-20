import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContactDto } from './dto/create-contact.dto.js';
import type { UpdateContactDto } from './dto/update-contact.dto.js';

@Injectable()
export class ClientsContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateContactDto) {
    await this.ensureClientExists(clientId);
    const contact = await this.prisma.contact.create({
      data: { ...dto, clientId },
    });
    return { data: contact };
  }

  async update(clientId: string, contactId: string, dto: UpdateContactDto) {
    await this.ensureContactExists(clientId, contactId);
    const contact = await this.prisma.contact.update({
      where: { id: contactId },
      data: dto,
    });
    return { data: contact };
  }

  async remove(clientId: string, contactId: string) {
    await this.ensureContactExists(clientId, contactId);
    await this.prisma.contact.delete({ where: { id: contactId } });
    return { data: { success: true } };
  }

  private async ensureClientExists(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Client not found');
  }

  private async ensureContactExists(clientId: string, contactId: string) {
    await this.ensureClientExists(clientId);
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, clientId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
  }
}
