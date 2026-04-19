export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  reporterId: string | null;
  estimatedHours: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  trackTime: boolean;
  billingType: 'hourly' | 'non_billable' | null;
  workTypeId: string | null;
  position: number;
  labels: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  doneAt: Date | null;
}

export interface TaskDependency {
  taskId: string;
  dependsOnId: string;
  type: DependencyType;
}

export interface CreateTaskDto {
  projectId: string;
  parentTaskId?: string | null;
  name: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  reporterId?: string | null;
  estimatedHours?: number | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  trackTime?: boolean;
  billingType?: 'hourly' | 'non_billable' | null;
  workTypeId?: string | null;
  position?: number;
  labels?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateTaskDto {
  parentTaskId?: string | null;
  name?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  reporterId?: string | null;
  estimatedHours?: number | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  trackTime?: boolean;
  billingType?: 'hourly' | 'non_billable' | null;
  workTypeId?: string | null;
  position?: number;
  labels?: string[];
  customFields?: Record<string, unknown>;
}
