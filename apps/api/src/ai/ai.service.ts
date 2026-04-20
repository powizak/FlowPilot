import { createHash } from 'node:crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { errorResponse } from '../auth/auth.errors.js';
import { RedisService } from '../redis/redis.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type {
  AIChatContext,
  AIProviderModelsView,
  AIProviderName,
  AISkillRunResult,
  AITextGenerationResult,
} from './ai.types.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { OpenRouterProvider } from './providers/openrouter.provider.js';
import type { AIProvider } from './providers/ai-provider.interface.js';
import { EchoSkill } from './skills/echo.skill.js';
import { MeetingToTasksSkill } from './skills/meeting-to-tasks.skill.js';
import { TaskDecompositionSkill } from './skills/task-decomposition.skill.js';
import type { AISkill } from './skills/ai-skill.interface.js';
import { AIUsageService } from './usage/ai-usage.service.js';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly providers: AIProvider[];
  private readonly skills: AISkill[];

  constructor(
    openaiProvider: OpenAIProvider,
    geminiProvider: GeminiProvider,
    openRouterProvider: OpenRouterProvider,
    echoSkill: EchoSkill,
    taskDecompositionSkill: TaskDecompositionSkill,
    meetingToTasksSkill: MeetingToTasksSkill,
    private readonly settingsService: SettingsService,
    private readonly redisService: RedisService,
    private readonly usageService: AIUsageService,
  ) {
    this.providers = [openaiProvider, geminiProvider, openRouterProvider];
    this.skills = [echoSkill, taskDecompositionSkill, meetingToTasksSkill];
  }

  async listModels(): Promise<{ providers: AIProviderModelsView[] }> {
    const providers = await Promise.all(
      this.providers.map(async (provider) => ({
        name: provider.name,
        models: await provider.listModels(),
        isConfigured: await provider.isConfigured(),
      })),
    );
    return { providers };
  }

  async getUsage(
    userId: string,
  ): Promise<{ tokensUsed: number; budget: number; resetDate: string }> {
    const budget = await this.getMonthlyBudget();
    return this.usageService.getUsageSummary(userId, budget);
  }

  async runSkill(
    skillName: string,
    input: unknown,
    userId: string,
  ): Promise<AISkillRunResult> {
    const skill = this.skills.find((entry) => entry.name === skillName);
    if (skill === undefined) {
      throw new NotFoundException(
        errorResponse(
          'AI_SKILL_NOT_FOUND',
          `AI skill "${skillName}" not found`,
        ),
      );
    }

    await this.assertBudget(userId);
    const prompt = skill.execute(input);
    const result = await this.generateWithFallback(skill.systemPrompt, prompt);
    const tokensUsed = result.inputTokens + result.outputTokens;
    await this.usageService.recordUsage(userId, tokensUsed);
    return {
      result: result.text,
      tokensUsed,
    };
  }

  async chat(
    message: string,
    context: AIChatContext | undefined,
    userId: string,
  ): Promise<{ reply: string }> {
    await this.assertBudget(userId);
    const systemPrompt = this.buildChatSystemPrompt(context);
    const result = await this.generateWithFallback(systemPrompt, message);
    await this.usageService.recordUsage(
      userId,
      result.inputTokens + result.outputTokens,
    );
    return { reply: result.text };
  }

  private async generateWithFallback(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AITextGenerationResult> {
    const cacheKey = this.getCacheKey(systemPrompt, userPrompt);
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return { text: cached, inputTokens: 0, outputTokens: 0 };
    }

    const orderedProviders = await this.getOrderedProviders();
    const configuredProviders =
      await this.filterConfiguredProviders(orderedProviders);
    if (configuredProviders.length === 0) {
      throw new HttpException(
        errorResponse(
          'AI_PROVIDER_NOT_CONFIGURED',
          'No AI provider is configured',
        ),
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let lastError: unknown = null;
    for (const provider of configuredProviders) {
      try {
        const result = await provider.generateText(userPrompt, systemPrompt, {
          maxTokens: 1_000,
          temperature: 0.4,
        });
        await this.redisService.set(cacheKey, result.text, 3600);
        return result;
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : 'Unknown provider error';
        this.logger.warn(`AI provider ${provider.name} failed: ${message}`);
      }
    }

    throw new HttpException(
      errorResponse('AI_PROVIDER_FAILED', this.toErrorMessage(lastError)),
      HttpStatus.BAD_GATEWAY,
    );
  }

  private async filterConfiguredProviders(
    providers: AIProvider[],
  ): Promise<AIProvider[]> {
    const results = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        configured: await provider.isConfigured(),
      })),
    );
    return results
      .filter((entry) => entry.configured)
      .map((entry) => entry.provider);
  }

  private async getOrderedProviders(): Promise<AIProvider[]> {
    const preferred = await this.getPreferredProvider();
    return [...this.providers].sort((left, right) => {
      if (left.name === preferred) return -1;
      if (right.name === preferred) return 1;
      return 0;
    });
  }

  private buildChatSystemPrompt(context: AIChatContext | undefined): string {
    const contextSummary = [
      context?.projectId === undefined
        ? null
        : `projectId=${context.projectId}`,
      context?.taskId === undefined ? null : `taskId=${context.taskId}`,
    ]
      .filter((value): value is string => value !== null)
      .join(', ');

    return contextSummary.length === 0
      ? 'You are FlowPilot AI assistant. Provide concise, helpful answers for project work.'
      : `You are FlowPilot AI assistant. Provide concise, helpful answers for project work. Context: ${contextSummary}.`;
  }

  private getCacheKey(systemPrompt: string, userPrompt: string): string {
    const hash = createHash('sha256')
      .update(`${systemPrompt}${userPrompt}`)
      .digest('hex');
    return `ai:cache:${hash}`;
  }

  private async assertBudget(userId: string): Promise<void> {
    const budget = await this.getMonthlyBudget();
    const used = await this.usageService.getMonthlyUsage(userId);
    if (used >= budget) {
      throw new HttpException(
        errorResponse(
          'AI_MONTHLY_BUDGET_EXCEEDED',
          'Monthly AI token budget exceeded',
        ),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async getMonthlyBudget(): Promise<number> {
    const raw = await this.getSetting('ai.monthlyBudgetTokens', '100000');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100000;
  }

  private async getPreferredProvider(): Promise<AIProviderName> {
    const value = await this.getSetting('ai.preferredProvider', 'openai');
    return value === 'gemini' || value === 'openrouter' ? value : 'openai';
  }

  private async getSetting(key: string, fallback: string): Promise<string> {
    try {
      return await this.settingsService.get(key);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return fallback;
      }
      throw error;
    }
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'All AI providers failed';
  }
}
