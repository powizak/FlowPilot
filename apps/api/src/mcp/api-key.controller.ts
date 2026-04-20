import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { ApiKeyService } from './api-key.service.js';

@Controller('api/api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.apiKeyService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.apiKeyService.list(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.apiKeyService.revoke(id, user.id);
  }
}
