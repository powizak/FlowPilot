import { Injectable } from '@nestjs/common';
import type { AISkill } from './ai-skill.interface.js';

@Injectable()
export class MeetingToTasksSkill implements AISkill {
  readonly name = 'meeting-to-tasks';
  readonly description =
    'Extracts action items from meeting notes and returns structured tasks.';
  readonly systemPrompt =
    'You are a project manager. Extract action items from meeting notes. Respond ONLY with valid JSON: array of objects with fields: name (string), description (string), suggestedAssignee (string|null), deadline (string|null, ISO date), priority ("none"|"low"|"medium"|"high"|"urgent"). No markdown, no explanation.';

  execute(input: unknown): string {
    if (input !== null && typeof input === 'object' && 'text' in input) {
      return String((input as { text: string }).text);
    }

    if (typeof input === 'string') {
      return input;
    }

    return '';
  }
}
