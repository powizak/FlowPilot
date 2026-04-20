export type AIProviderName = 'openai' | 'gemini' | 'openrouter';

export interface AITextGenerationOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AITextGenerationResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AIChatContext {
  projectId?: string;
  taskId?: string;
}

export interface AIProviderModelsView {
  name: AIProviderName;
  models: string[];
  isConfigured: boolean;
}

export interface AISkillRunResult {
  result: string;
  tokensUsed: number;
}
