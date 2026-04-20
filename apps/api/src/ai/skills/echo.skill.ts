import { Injectable } from '@nestjs/common';
import type { AISkill } from './ai-skill.interface.js';

@Injectable()
export class EchoSkill implements AISkill {
  readonly name = 'echo';
  readonly description = 'Returns the provided input through the AI provider.';
  readonly systemPrompt = 'You are a helpful assistant';

  execute(input: unknown): string {
    if (typeof input === 'string') {
      return input;
    }

    if (input === null || input === undefined) {
      return '';
    }

    return JSON.stringify(input);
  }
}
