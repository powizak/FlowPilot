import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ViewsController } from './views.controller.js';
import { ViewsService } from './views.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ViewsController],
  providers: [ViewsService],
})
export class ViewsModule {}
