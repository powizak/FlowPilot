import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateViewInput = {
  name: string;
  entityType: string;
  config: Prisma.InputJsonValue;
};

type UpdateViewInput = Partial<CreateViewInput>;

@Injectable()
export class ViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, entityType?: string) {
    const views = await this.prisma.userView.findMany({
      where: { userId, ...(entityType === undefined ? {} : { entityType }) },
      orderBy: { updatedAt: 'desc' },
    });

    return { data: views };
  }

  async create(userId: string, input: CreateViewInput) {
    const view = await this.prisma.userView.create({
      data: {
        userId,
        name: input.name,
        entityType: input.entityType,
        config: input.config,
      },
    });

    return { data: view };
  }

  async update(userId: string, id: string, input: UpdateViewInput) {
    await this.ensureOwned(userId, id);

    const view = await this.prisma.userView.update({
      where: { id },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.entityType === undefined
          ? {}
          : { entityType: input.entityType }),
        ...(input.config === undefined ? {} : { config: input.config }),
      },
    });

    return { data: view };
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.userView.delete({ where: { id } });
    return { data: { success: true } };
  }

  private async ensureOwned(userId: string, id: string) {
    const view = await this.prisma.userView.findFirst({
      where: { id, userId },
    });
    if (view === null) {
      throw new NotFoundException('View not found');
    }
    return view;
  }
}
