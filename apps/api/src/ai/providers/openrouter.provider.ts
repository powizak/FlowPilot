import { Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/settings.service.js';
import type {
  AITextGenerationOptions,
  AITextGenerationResult,
} from '../ai.types.js';
import type { AIProvider } from './ai-provider.interface.js';

@Injectable()
export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter' as const;

  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const [apiKey, model] = await Promise.all([
      this.getSetting('ai.openrouter.apiKey', ''),
      this.getSetting('ai.openrouter.model', 'mistralai/mixtral-8x7b-instruct'),
    ]);
    return apiKey.length > 0 && model.length > 0;
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: AITextGenerationOptions,
  ): Promise<AITextGenerationResult> {
    const apiKey = await this.getSetting('ai.openrouter.apiKey', '');
    const model = await this.getSetting(
      'ai.openrouter.model',
      'mistralai/mixtral-8x7b-instruct',
    );
    if (apiKey.length === 0) {
      throw new Error('OpenRouter provider is not configured');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://flowpilot.local',
        'X-Title': 'FlowPilot',
      },
    });
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    return {
      text: completion.choices
        .map((choice) => choice.message.content ?? '')
        .join('\n')
        .trim(),
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    };
  }

  async listModels(): Promise<string[]> {
    if (!(await this.isConfigured())) {
      return [];
    }
    return [
      await this.getSetting(
        'ai.openrouter.model',
        'mistralai/mixtral-8x7b-instruct',
      ),
    ];
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
}
