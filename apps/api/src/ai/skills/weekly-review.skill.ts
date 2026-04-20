import { Injectable } from '@nestjs/common';
import type { AISkill } from './ai-skill.interface.js';

interface WeeklyReviewInput {
  dateFrom: string;
  dateTo: string;
  projects: string[];
  completedTasks: string[];
  inProgressTasks: string[];
  totalHours: number;
}

@Injectable()
export class WeeklyReviewSkill implements AISkill {
  readonly name = 'weekly-review';
  readonly description = 'Generates a weekly status report from work data.';
  readonly systemPrompt =
    'You are a project manager writing a weekly status report. Given data about work done this week, write a concise markdown-formatted summary suitable for sharing with clients or management. Include: hours worked by project, tasks completed, tasks in progress, any blockers. Be professional and concise.';

  execute(input: unknown): string {
    const data = input as WeeklyReviewInput;

    const projectList =
      data.projects.length > 0
        ? data.projects.map((p) => `- ${p}`).join('\n')
        : '- (none)';

    const completedList =
      data.completedTasks.length > 0
        ? data.completedTasks.map((t) => `- ${t}`).join('\n')
        : '- (none)';

    const inProgressList =
      data.inProgressTasks.length > 0
        ? data.inProgressTasks.map((t) => `- ${t}`).join('\n')
        : '- (none)';

    return [
      `Period: ${data.dateFrom} to ${data.dateTo}`,
      `Total hours: ${data.totalHours}`,
      '',
      'Projects worked on:',
      projectList,
      '',
      'Completed tasks:',
      completedList,
      '',
      'In-progress tasks:',
      inProgressList,
    ].join('\n');
  }
}
