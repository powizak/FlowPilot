import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { OpenRouterProvider } from './providers/openrouter.provider.js';
import { EchoSkill } from './skills/echo.skill.js';
import { AIUsageService } from './usage/ai-usage.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [AIController],
  providers: [
    AIService,
    AIUsageService,
    OpenAIProvider,
    GeminiProvider,
    OpenRouterProvider,
    EchoSkill,
  ],
  exports: [AIService],
})
export class AIModule {}
