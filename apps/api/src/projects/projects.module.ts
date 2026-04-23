import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ProjectsAccessService } from './projects-access.service.js';
import { ProjectsCloneService } from './projects-clone.service.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsMembersService } from './projects-members.service.js';
import { ProjectsService } from './projects.service.js';
import { ProjectsStatsService } from './projects-stats.service.js';

@Module({
  imports: [ActivityModule, SettingsModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectsAccessService,
    ProjectsStatsService,
    ProjectsCloneService,
    ProjectsMembersService,
  ],
  exports: [ProjectsService, ProjectsAccessService],
})
export class ProjectsModule {}
