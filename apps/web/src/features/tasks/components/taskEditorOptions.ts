import type { TaskPriority, TaskStatus } from '@flowpilot/shared';

export const TASK_EDITOR_STATUSES: Array<{
  value: TaskStatus;
  label: string;
}> = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TASK_EDITOR_PRIORITIES: Array<{
  value: TaskPriority;
  label: string;
}> = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
