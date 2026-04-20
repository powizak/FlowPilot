import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import type { Product } from '@flowpilot/shared';
import type { Product as PrismaProduct } from '@prisma/client';

export interface PaginatedProducts {
  data: Product[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  private toProduct(p: PrismaProduct): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      unit: p.unit,
      defaultUnitPrice: Number(p.defaultUnitPrice),
      defaultVatPercent: Number(p.defaultVatPercent),
      category: p.category,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<PaginatedProducts> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.category) {
      where.category = params.category;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prismaService.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toProduct(p)),
      meta: { total, page, limit },
    };
  }

  async findCategories(): Promise<string[]> {
    const results = await this.prismaService.product.findMany({
      distinct: ['category'],
      select: { category: true },
      where: { category: { not: null } },
      orderBy: { category: 'asc' },
    });
    return results.map((r) => r.category).filter((c): c is string => c !== null);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException({ message: `Product with id "${id}" not found` });
    }
    return this.toProduct(product);
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = await this.prismaService.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        unit: dto.unit,
        defaultUnitPrice: dto.defaultUnitPrice,
        defaultVatPercent: dto.defaultVatPercent,
        category: dto.category,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toProduct(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const existing = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Product with id "${id}" not found` });
    }

    const product = await this.prismaService.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.defaultUnitPrice !== undefined && { defaultUnitPrice: dto.defaultUnitPrice }),
        ...(dto.defaultVatPercent !== undefined && { defaultVatPercent: dto.defaultVatPercent }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.toProduct(product);
  }

  async softDelete(id: string): Promise<Product> {
    const existing = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: `Product with id "${id}" not found` });
    }

    const product = await this.prismaService.product.update({
      where: { id },
      data: { isActive: false },
    });
    return this.toProduct(product);
  }
}
