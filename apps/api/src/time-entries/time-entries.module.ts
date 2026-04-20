import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { TimeEntriesBillingService } from './time-entries-billing.service.js';
import { TimeEntriesController } from './time-entries.controller.js';
import { TimeEntriesService } from './time-entries.service.js';

@Module({
  imports: [ProjectsModule, SettingsModule],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService, TimeEntriesBillingService],
})
export class TimeEntriesModule {}
