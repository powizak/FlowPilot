import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ApiKeyModule } from './api-key.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';

@Module({
  imports: [ApiKeyModule, PrismaModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
