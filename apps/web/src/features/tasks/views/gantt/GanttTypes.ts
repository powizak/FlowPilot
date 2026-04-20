export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export interface GanttTask {
  id: string;
  name: string;
  startDate: string | null;
  dueDate: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  assigneeId: string | null;
  parentId: string | null;
  parentTaskId?: string | null;
  dependencies?: { taskId: string; dependsOnId: string; type: string }[];
  subtasks?: GanttTask[];
  depth?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  progress?: number;
}

export interface GanttScale {
  zoom: ZoomLevel;
  pixelsPerDay: number;
  startDate: Date;
  endDate: Date;
  totalWidth: number;
  totalDays: number;
}
