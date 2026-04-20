import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { AutomationsController } from './automations.controller.js';
import { AutomationsExecutor } from './automations.executor.js';
import { AutomationsService } from './automations.service.js';

@Module({
  imports: [ProjectsModule, NotificationsModule],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationsExecutor],
  exports: [AutomationsExecutor],
})
export class AutomationsModule {}
