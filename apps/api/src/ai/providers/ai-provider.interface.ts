import type {
  AIProviderName,
  AITextGenerationOptions,
  AITextGenerationResult,
} from '../ai.types.js';

export interface AIProvider {
  readonly name: AIProviderName;
  isConfigured(): Promise<boolean>;
  generateText(
    prompt: string,
    systemPrompt: string,
    options?: AITextGenerationOptions,
  ): Promise<AITextGenerationResult>;
  listModels(): Promise<string[]>;
}
