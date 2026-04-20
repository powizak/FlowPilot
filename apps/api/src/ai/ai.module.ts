import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { OpenRouterProvider } from './providers/openrouter.provider.js';
import { EchoSkill } from './skills/echo.skill.js';
import { InvoiceDraftSkill } from './skills/invoice-draft.skill.js';
import { MeetingToTasksSkill } from './skills/meeting-to-tasks.skill.js';
import { TaskDecompositionSkill } from './skills/task-decomposition.skill.js';
import { WeeklyReviewSkill } from './skills/weekly-review.skill.js';
import { AIUsageService } from './usage/ai-usage.service.js';

@Module({
  imports: [SettingsModule, TasksModule],
  controllers: [AIController],
  providers: [
    AIService,
    AIUsageService,
    OpenAIProvider,
    GeminiProvider,
    OpenRouterProvider,
    EchoSkill,
    InvoiceDraftSkill,
    MeetingToTasksSkill,
    TaskDecompositionSkill,
    WeeklyReviewSkill,
  ],
  exports: [AIService],
})
export class AIModule {}
