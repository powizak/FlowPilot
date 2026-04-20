import { Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/settings.service.js';
import type {
  AITextGenerationOptions,
  AITextGenerationResult,
} from '../ai.types.js';
import type { AIProvider } from './ai-provider.interface.js';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;

  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const [apiKey, model] = await Promise.all([
      this.getSetting('ai.openai.apiKey', ''),
      this.getSetting('ai.openai.model', 'gpt-4o-mini'),
    ]);
    return apiKey.length > 0 && model.length > 0;
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: AITextGenerationOptions,
  ): Promise<AITextGenerationResult> {
    const apiKey = await this.getSetting('ai.openai.apiKey', '');
    const model = await this.getSetting('ai.openai.model', 'gpt-4o-mini');
    if (apiKey.length === 0) {
      throw new Error('OpenAI provider is not configured');
    }

    const client = new OpenAI({ apiKey });
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
    return [await this.getSetting('ai.openai.model', 'gpt-4o-mini')];
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
