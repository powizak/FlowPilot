import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateClientDto } from './dto/create-client.dto.js';
import type { UpdateClientDto } from './dto/update-client.dto.js';
import type { ListClientsQueryDto } from './dto/list-clients-query.dto.js';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListClientsQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { ic: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contacts: true, _count: { select: { projects: true, invoices: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        contacts: true,
        _count: { select: { projects: true, invoices: true } },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return { data: client };
  }

  async create(dto: CreateClientDto) {
    const client = await this.prisma.client.create({ data: dto });
    return { data: client };
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    const client = await this.prisma.client.update({ where: { id }, data: dto });
    return { data: client };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: client };
  }

  async findProjects(id: string) {
    await this.ensureExists(id);
    const projects = await this.prisma.project.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { data: projects };
  }

  async findInvoices(id: string) {
    await this.ensureExists(id);
    const invoices = await this.prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { data: invoices };
  }

  private async ensureExists(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }
}
