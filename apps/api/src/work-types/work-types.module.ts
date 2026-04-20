import { Module } from '@nestjs/common';
import { WorkTypesService } from './work-types.service.js';
import { WorkTypesController } from './work-types.controller.js';

@Module({
  providers: [WorkTypesService],
  controllers: [WorkTypesController],
  exports: [WorkTypesService],
})
export class WorkTypesModule {}