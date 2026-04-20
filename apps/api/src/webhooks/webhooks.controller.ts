import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { WebhooksService } from './webhooks.service.js';
import type { CreateWebhookDto } from './dto/create-webhook.dto.js';
import type { UpdateWebhookDto } from './dto/update-webhook.dto.js';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @Roles('admin' as UserRole)
  list() {
    return this.webhooksService.list();
  }

  @Post()
  @Roles('admin' as UserRole)
  create(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(dto);
  }

  @Put(':id')
  @Roles('admin' as UserRole)
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooksService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin' as UserRole)
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }

  @Get(':id/deliveries')
  @Roles('admin' as UserRole)
  deliveries(@Param('id') id: string) {
    return this.webhooksService.getDeliveries(id);
  }
}
