import type { Task } from '@flowpilot/shared';
import type { GanttTask } from './views/gantt/GanttTypes';

type ApiTaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'cancelled';

type ApiTaskBillingType = 'hourly' | 'fixed' | 'retainer' | null;

interface ApiTaskUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
}

interface ApiTaskBase {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: ApiTaskStatus;
  priority: Task['priority'];
  assigneeId: string | null;
  reporterId: string | null;
  estimatedHours: number | null;
  dueDate: Date | string | null;
  startDate: Date | string | null;
  trackTime: boolean;
  billingType: ApiTaskBillingType;
  workTypeId: string | null;
  position: number;
  labels: string[];
  customFields: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
  doneAt: Date | string | null;
  assignee?: ApiTaskUser | null;
  reporter?: ApiTaskUser | null;
}

export interface ApiProjectTask extends ApiTaskBase {
  dependencies?: Array<{ taskId: string; dependsOnId: string; type: string }>;
  subtasks?: ApiProjectTask[];
}

export interface ApiTaskView extends ApiTaskBase {
  actualHours: number;
  deletedAt: Date | string | null;
  subtasks?: ApiTaskView[];
}

function toUiStatus(status: ApiTaskStatus): Task['status'] {
  if (status === 'backlog') return 'todo';
  if (status === 'review') return 'in_progress';
  return status;
}

function toUiBillingType(billingType: ApiTaskBillingType): Task['billingType'] {
  if (billingType === 'hourly') return 'hourly';
  if (billingType === null) return null;
  return 'non_billable';
}

function toDateOrNull(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function normalizeProjectTask(task: ApiTaskBase): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    parentTaskId: task.parentId,
    name: task.title,
    description: task.description,
    status: toUiStatus(task.status),
    priority: task.priority,
    assigneeId: task.assigneeId,
    reporterId: task.reporterId,
    estimatedHours: task.estimatedHours,
    dueDate: toDateOrNull(task.dueDate),
    startDate: toDateOrNull(task.startDate),
    trackTime: task.trackTime,
    billingType: toUiBillingType(task.billingType),
    workTypeId: task.workTypeId,
    position: task.position,
    labels: task.labels,
    customFields: {
      ...task.customFields,
      assigneeName: task.assignee?.name,
      reporterName: task.reporter?.name,
    },
    createdAt: toDate(task.createdAt),
    updatedAt: toDate(task.updatedAt),
    doneAt: toDateOrNull(task.doneAt),
  };
}

export function normalizeProjectTasks(tasks: ApiTaskBase[]): Task[] {
  return tasks.map(normalizeProjectTask);
}

export function normalizeProjectTaskForGantt(task: ApiProjectTask): GanttTask {
  return {
    id: task.id,
    name: task.title,
    startDate:
      task.startDate instanceof Date
        ? task.startDate.toISOString()
        : task.startDate,
    dueDate:
      task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
    status: toUiStatus(task.status),
    assigneeId: task.assigneeId,
    parentId: task.parentId,
    parentTaskId: task.parentId,
    dependencies: task.dependencies,
    subtasks: task.subtasks?.map(normalizeProjectTaskForGantt),
  };
}

export function normalizeProjectTasksForGantt(
  tasks: ApiProjectTask[],
): GanttTask[] {
  return tasks.map(normalizeProjectTaskForGantt);
}

export function toTaskUpdatePayload(updates: Partial<Task>) {
  const payload: Record<string, unknown> = {
    ...updates,
  };

  if ('name' in payload) {
    payload.title = payload.name;
    delete payload.name;
  }

  if ('parentTaskId' in payload) {
    payload.parentId = payload.parentTaskId;
    delete payload.parentTaskId;
  }

  return payload;
}
