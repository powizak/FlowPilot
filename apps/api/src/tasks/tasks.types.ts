import type { ApiResponse, PaginatedResponse, UserRole } from '@flowpilot/shared';

export type ApiTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type ApiTaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type ApiDependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH';
export type ApiTaskBillingType = 'hourly' | 'fixed' | 'retainer' | null;

export interface TaskUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface TaskDependencyView {
  id: string;
  taskId: string;
  dependsOnId: string;
  type: ApiDependencyType;
  task: {
    id: string;
    title: string;
    status: ApiTaskStatus;
    priority: ApiTaskPriority;
    projectId: string;
    assigneeId: string | null;
    dueDate: Date | null;
  };
}

export interface TaskTimeSummary {
  ownEstimatedHours: number;
  ownActualHours: number;
  childrenEstimatedHours: number;
  childrenActualHours: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

export interface TaskView {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: ApiTaskStatus;
  priority: ApiTaskPriority;
  position: number;
  estimatedHours: number | null;
  actualHours: number;
  dueDate: Date | null;
  startDate: Date | null;
  assigneeId: string | null;
  reporterId: string | null;
  workTypeId: string | null;
  billingType: ApiTaskBillingType;
  trackTime: boolean;
  labels: string[];
  customFields: Record<string, unknown>;
  deletedAt: Date | null;
  doneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: TaskUserView | null;
  reporter: TaskUserView | null;
  subtasks?: TaskView[];
  dependencies?: TaskDependencyView[];
  timeSummary?: TaskTimeSummary;
}

export type TaskResponse = ApiResponse<TaskView>;
export type TaskListResponse = PaginatedResponse<TaskView>;
export type ReorderTasksResponse = ApiResponse<{ success: true }>;
