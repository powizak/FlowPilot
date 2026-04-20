import { Injectable } from '@nestjs/common';
import type { AISkill } from './ai-skill.interface.js';

@Injectable()
export class TaskDecompositionSkill implements AISkill {
  readonly name = 'task-decomposition';
  readonly description =
    'Break a task into 3-7 concrete subtasks with hour estimates';
  readonly systemPrompt =
    'You are a senior project manager. Given a task, decompose it into 3-7 concrete actionable subtasks. Respond ONLY with valid JSON: an array of objects with fields: name (string), description (string), estimatedHours (number). No markdown, no explanation.';

  execute(input: unknown): string {
    const { taskName, taskDescription, estimatedHours } = input as {
      taskName: string;
      taskDescription: string;
      estimatedHours: number;
    };

    return [
      `Task: ${taskName}`,
      `Description: ${taskDescription || 'No description provided'}`,
      `Estimated hours: ${estimatedHours ?? 'not specified'}`,
      '',
      'Decompose this task into 3-7 concrete actionable subtasks with hour estimates.',
    ].join('\n');
  }
}
