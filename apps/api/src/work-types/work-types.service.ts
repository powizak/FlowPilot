import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWorkTypeDto } from './dto/create-work-type.dto.js';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto.js';
import type { WorkType } from '@flowpilot/shared';
import type { WorkType as PrismaWorkType } from '@prisma/client';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

@Injectable()
export class WorkTypesService {
  constructor(private readonly prismaService: PrismaService) {}

  private toWorkType(wt: PrismaWorkType): WorkType {
    return {
      id: wt.id,
      name: wt.name,
      hourlyRate: Number(wt.hourlyRate),
      color: wt.color,
      isActive: wt.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private validateColor(color: string): void {
    if (!HEX_COLOR_REGEX.test(color)) {
      throw new ConflictException({
        message: `Invalid color format: "${color}". Expected format: #RRGGBB`,
      });
    }
  }

  private async checkNameUniqueness(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prismaService.workType.findFirst({
      where: { name, id: excludeId ? { not: excludeId } : undefined },
    });
    if (existing) {
      throw new ConflictException({
        message: `Work type with name "${name}" already exists`,
      });
    }
  }

  async findAll(includeInactive = false): Promise<WorkType[]> {
    const workTypes = await this.prismaService.workType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
    return workTypes.map((wt) => this.toWorkType(wt));
  }

  async findOne(id: string): Promise<WorkType> {
    const workType = await this.prismaService.workType.findUnique({
      where: { id },
    });
    if (!workType) {
      throw new NotFoundException({ message: `Work type with id "${id}" not found` });
    }
    return this.toWorkType(workType);
  }

  async create(dto: CreateWorkTypeDto): Promise<WorkType> {
    this.validateColor(dto.color);
    await this.checkNameUniqueness(dto.name);

    const workType = await this.prismaService.workType.create({
      data: {
        name: dto.name,
        hourlyRate: dto.hourlyRate,
        color: dto.color,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toWorkType(workType);
  }

  async update(id: string, dto: UpdateWorkTypeDto): Promise<WorkType> {
    const existing = await this.prismaService.workType.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Work type with id "${id}" not found` });
    }

    if (dto.name && dto.name !== existing.name) {
      await this.checkNameUniqueness(dto.name, id);
    }
    if (dto.color) {
      this.validateColor(dto.color);
    }

    const workType = await this.prismaService.workType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.toWorkType(workType);
  }

  async softDelete(id: string): Promise<WorkType> {
    const existing = await this.prismaService.workType.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Work type with id "${id}" not found` });
    }

    const workType = await this.prismaService.workType.update({
      where: { id },
      data: { isActive: false },
    });
    return this.toWorkType(workType);
  }
}