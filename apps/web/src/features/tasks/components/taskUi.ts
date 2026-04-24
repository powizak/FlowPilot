import type { TaskPriority, TaskStatus } from '@flowpilot/shared';

export interface TaskProjectOption {
  id: string;
  name: string;
}

export interface TaskTranslationEntry {
  key: string;
  fallback: string;
}

export function getTaskStatusTranslation(
  status: TaskStatus,
): TaskTranslationEntry {
  if (status === 'in_progress') {
    return { key: 'tasks.statusInProgress', fallback: 'In Progress' };
  }
  if (status === 'done') {
    return { key: 'tasks.statusDone', fallback: 'Done' };
  }
  if (status === 'cancelled') {
    return { key: 'tasks.statusCancelled', fallback: 'Cancelled' };
  }
  return { key: 'tasks.statusTodo', fallback: 'Todo' };
}

export function getTaskPriorityTranslation(
  priority: TaskPriority,
): TaskTranslationEntry {
  if (priority === 'none') {
    return { key: 'tasks.priorityNone', fallback: 'None' };
  }
  if (priority === 'low') {
    return { key: 'tasks.priorityLow', fallback: 'Low' };
  }
  if (priority === 'high') {
    return { key: 'tasks.priorityHigh', fallback: 'High' };
  }
  if (priority === 'urgent') {
    return { key: 'tasks.priorityUrgent', fallback: 'Urgent' };
  }
  return { key: 'tasks.priorityMedium', fallback: 'Medium' };
}
