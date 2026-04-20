import { Module } from '@nestjs/common';
import { ApiKeyController } from './api-key.controller.js';
import { ApiKeyAuthGuard } from './api-key-auth.guard.js';
import { ApiKeyService } from './api-key.service.js';

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyAuthGuard],
  exports: [ApiKeyService, ApiKeyAuthGuard],
})
export class ApiKeyModule {}
