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
import type { Prisma } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { ViewsService } from './views.service.js';

type CreateViewBody = {
  name: string;
  entityType: string;
  config: Prisma.InputJsonValue;
};

type UpdateViewBody = Partial<CreateViewBody>;

@Controller('api/views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType?: string,
  ) {
    return this.viewsService.list(user.id, entityType);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateViewBody) {
    return this.viewsService.create(user.id, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateViewBody,
  ) {
    return this.viewsService.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.viewsService.remove(user.id, id);
  }
}
