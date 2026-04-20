export interface AISkill {
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  execute(input: unknown): string;
}
