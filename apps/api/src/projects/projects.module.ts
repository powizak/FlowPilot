import { Module } from '@nestjs/common';
import { ProjectsAccessService } from './projects-access.service.js';
import { ProjectsCloneService } from './projects-clone.service.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { ProjectsStatsService } from './projects-stats.service.js';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsAccessService, ProjectsStatsService, ProjectsCloneService],
  exports: [ProjectsService, ProjectsAccessService],
})
export class ProjectsModule {}
