import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { TasksController } from './tasks.controller.js';
import { TasksDependenciesService } from './tasks-dependencies.service.js';
import { TasksService } from './tasks.service.js';
import { TasksSubtasksService } from './tasks-subtasks.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [TasksController],
  providers: [TasksService, TasksSubtasksService, TasksDependenciesService],
})
export class TasksModule {}
