import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SettingsService } from '../../settings/settings.service.js';
import type {
  AITextGenerationOptions,
  AITextGenerationResult,
} from '../ai.types.js';
import type { AIProvider } from './ai-provider.interface.js';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const [apiKey, model] = await Promise.all([
      this.getSetting('ai.gemini.apiKey', ''),
      this.getSetting('ai.gemini.model', 'gemini-1.5-flash'),
    ]);
    return apiKey.length > 0 && model.length > 0;
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: AITextGenerationOptions,
  ): Promise<AITextGenerationResult> {
    const apiKey = await this.getSetting('ai.gemini.apiKey', '');
    const modelName = await this.getSetting(
      'ai.gemini.model',
      'gemini-1.5-flash',
    );
    if (apiKey.length === 0) {
      throw new Error('Gemini provider is not configured');
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      },
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const usage = response.usageMetadata;

    return {
      text: response.text().trim(),
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  }

  async listModels(): Promise<string[]> {
    if (!(await this.isConfigured())) {
      return [];
    }
    return [await this.getSetting('ai.gemini.model', 'gemini-1.5-flash')];
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
