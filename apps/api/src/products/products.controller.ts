import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.productsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('categories')
  async findCategories() {
    const categories = await this.productsService.findCategories();
    return { data: categories };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.productsService.findOne(id) };
  }

  @Post()
  @Roles('ADMIN' as UserRole)
  async create(@Body() dto: CreateProductDto) {
    return { data: await this.productsService.create(dto) };
  }

  @Put(':id')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return { data: await this.productsService.update(id, dto) };
  }

  @Delete(':id')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return { data: await this.productsService.softDelete(id) };
  }
}
