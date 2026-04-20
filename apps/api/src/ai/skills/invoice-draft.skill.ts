import { Injectable } from '@nestjs/common';
import type { AISkill } from './ai-skill.interface.js';

interface InvoiceDraftEntry {
  description: string;
  hours: number;
  rate: number;
}

interface InvoiceDraftInput {
  projectName: string;
  entries: InvoiceDraftEntry[];
}

@Injectable()
export class InvoiceDraftSkill implements AISkill {
  readonly name = 'invoice-draft';
  readonly description =
    'Generates grouped invoice line items from time entries.';
  readonly systemPrompt =
    'You are a billing assistant. Given a list of time entries and project info, suggest grouped invoice line items with professional descriptions, a suggested note, and a suggested due date. Respond ONLY with valid JSON: { lineItems: [{description: string, quantity: number, unit: "hours", unitPrice: number}], note: string, suggestedDueDate: string }. No markdown.';

  execute(input: unknown): string {
    const data = input as InvoiceDraftInput;
    const entryLines = data.entries
      .map(
        (entry, index) =>
          `${index + 1}. "${entry.description}" — ${entry.hours}h @ $${entry.rate}/hr`,
      )
      .join('\n');

    return [
      `Project: ${data.projectName}`,
      `Number of entries: ${data.entries.length}`,
      '',
      'Time entries:',
      entryLines,
      '',
      'Please group related entries into professional invoice line items.',
    ].join('\n');
  }
}
