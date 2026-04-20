import type {
  BillingType,
  DependencyType,
  Prisma,
  TaskPriority,
  TaskStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import {
  getTaskDeletedAt,
  getWorkflowStatus,
  normalizeTaskMetadata,
  toApiBillingType,
  toApiDependencyType,
  toApiTaskPriority,
} from './tasks.shared.js';
import type { TaskDependencyView, TaskTimeSummary, TaskUserView, TaskView } from './tasks.types.js';

type TaskUserRecord = {
  id: string;
  email: string;
  name: string;
  role: PrismaUserRole;
};

type TaskRecord = {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  estimatedHours: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  assigneeId: string | null;
  reporterId: string | null;
  workTypeId: string | null;
  billingType: BillingType | null;
  trackTime: boolean;
  labels: Prisma.JsonValue;
  customFields: Prisma.JsonValue;
  doneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: TaskUserRecord | null;
  reporter?: TaskUserRecord | null;
  timeEntries?: Array<{ durationMinutes: number | null }>;
  childTasks?: TaskRecord[];
  dependencies?: Array<{
    taskId: string;
    dependsOnId: string;
    type: DependencyType;
    dependsOn?: TaskRecord | null;
  }>;
};

function toSharedRole(role: PrismaUserRole): 'admin' | 'member' | 'viewer' {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'VIEWER':
      return 'viewer';
    default:
      return 'member';
  }
}

function toTaskUserView(user: TaskUserRecord | null | undefined): TaskUserView | null {
  if (user === null || user === undefined) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toSharedRole(user.role),
  };
}

function toLabels(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toActualHours(timeEntries: Array<{ durationMinutes: number | null }> | undefined): number {
  const minutes = (timeEntries ?? []).reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  return Number((minutes / 60).toFixed(2));
}

function toTimeSummary(task: TaskRecord, subtasks: TaskView[]): TaskTimeSummary {
  const ownEstimatedHours = Number((task.estimatedHours ?? 0).toFixed(2));
  const ownActualHours = toActualHours(task.timeEntries);
  const childrenEstimatedHours = Number(
    subtasks.reduce((sum, child) => sum + (child.timeSummary?.totalEstimatedHours ?? 0), 0).toFixed(2),
  );
  const childrenActualHours = Number(
    subtasks.reduce((sum, child) => sum + (child.timeSummary?.totalActualHours ?? 0), 0).toFixed(2),
  );

  return {
    ownEstimatedHours,
    ownActualHours,
    childrenEstimatedHours,
    childrenActualHours,
    totalEstimatedHours: Number((ownEstimatedHours + childrenEstimatedHours).toFixed(2)),
    totalActualHours: Number((ownActualHours + childrenActualHours).toFixed(2)),
  };
}

function toDependencyView(taskId: string, dependency: NonNullable<TaskRecord['dependencies']>[number]): TaskDependencyView | null {
  if (dependency.dependsOn === null || dependency.dependsOn === undefined) return null;

  return {
    id: `${taskId}:${dependency.dependsOnId}`,
    taskId,
    dependsOnId: dependency.dependsOnId,
    type: toApiDependencyType(dependency.type),
    task: {
      id: dependency.dependsOn.id,
      title: dependency.dependsOn.name,
      status: getWorkflowStatus(dependency.dependsOn),
      priority: toApiTaskPriority(dependency.dependsOn.priority),
      projectId: dependency.dependsOn.projectId,
      assigneeId: dependency.dependsOn.assigneeId,
      dueDate: dependency.dependsOn.dueDate,
    },
  };
}

export function toTaskView(task: TaskRecord, detail = false): TaskView {
  const subtasks = (task.childTasks ?? [])
    .filter((subtask) => getTaskDeletedAt(subtask) === null)
    .map((subtask) => toTaskView(subtask, true));
  const timeSummary = toTimeSummary(task, subtasks);
  const dependencies = (task.dependencies ?? [])
    .map((dependency) => toDependencyView(task.id, dependency))
    .filter((dependency): dependency is TaskDependencyView => dependency !== null);

  return {
    id: task.id,
    projectId: task.projectId,
    parentId: task.parentTaskId,
    title: task.name,
    description: task.description,
    status: getWorkflowStatus(task),
    priority: toApiTaskPriority(task.priority),
    position: task.position,
    estimatedHours: task.estimatedHours,
    actualHours: timeSummary.ownActualHours,
    dueDate: task.dueDate,
    startDate: task.startDate,
    assigneeId: task.assigneeId,
    reporterId: task.reporterId,
    workTypeId: task.workTypeId,
    billingType: toApiBillingType(task.billingType),
    trackTime: task.trackTime,
    labels: toLabels(task.labels),
    customFields: normalizeTaskMetadata(task.customFields),
    deletedAt: getTaskDeletedAt(task),
    doneAt: task.doneAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignee: toTaskUserView(task.assignee),
    reporter: toTaskUserView(task.reporter),
    ...(detail ? { subtasks, dependencies, timeSummary } : {}),
  };
}
