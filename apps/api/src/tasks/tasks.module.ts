import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { AutomationsModule } from '../automations/automations.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { TasksController } from './tasks.controller.js';
import { TasksDependenciesService } from './tasks-dependencies.service.js';
import { TasksService } from './tasks.service.js';
import { TasksSubtasksService } from './tasks-subtasks.service.js';

@Module({
  imports: [ProjectsModule, ActivityModule, AutomationsModule, WebhooksModule],
  controllers: [TasksController],
  providers: [TasksService, TasksSubtasksService, TasksDependenciesService],
  exports: [TasksService],
})
export class TasksModule {}
