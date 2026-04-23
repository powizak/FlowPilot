import { GanttTask, GanttScale, ZoomLevel } from './GanttTypes';

export function getPixelsPerDay(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 56;
    case 'week':
      return 36;
    case 'month':
      return 14;
    case 'quarter':
      return 6;
    default:
      return 36;
  }
}

export function calculateScale(
  tasks: GanttTask[],
  zoom: ZoomLevel,
): GanttScale {
  const dates: number[] = [];
  const now = new Date();
  dates.push(now.getTime());

  tasks.forEach((t) => {
    if (t.startDate) dates.push(new Date(t.startDate).getTime());
    if (t.dueDate) dates.push(new Date(t.dueDate).getTime());
  });

  const minTime = Math.min(...dates);
  const maxTime = Math.max(...dates);

  const start = new Date(minTime);
  start.setMonth(start.getMonth() - 1);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(maxTime);
  end.setMonth(end.getMonth() + 2);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const pixelsPerDay = getPixelsPerDay(zoom);
  const totalWidth = totalDays * pixelsPerDay;

  return {
    zoom,
    pixelsPerDay,
    startDate: start,
    endDate: end,
    totalWidth,
    totalDays,
  };
}

export function diffDays(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function flattenTasks(
  tasks: GanttTask[],
  expandedIds: Set<string>,
): GanttTask[] {
  const result: GanttTask[] = [];

  const taskMap = new Map<string, GanttTask>();
  const childrenMap = new Map<string, GanttTask[]>();
  const rootTasks: GanttTask[] = [];

  const processTask = (t: GanttTask, parentId: string | null) => {
    taskMap.set(t.id, t);
    const pId = parentId || t.parentId || t.parentTaskId;
    if (pId) {
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId)!.push(t);
    } else {
      rootTasks.push(t);
    }
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach((st) => {
        processTask(st, t.id);
      });
    }
  };

  tasks.forEach((t) => {
    processTask(t, null);
  });

  const traverse = (node: GanttTask, depth: number) => {
    const children = childrenMap.get(node.id) || [];
    node.depth = depth;
    node.hasChildren = children.length > 0;
    node.isExpanded = expandedIds.has(node.id);

    if (children.length > 0 && node.progress === undefined) {
      const completed = children.filter((c) => c.status === 'done').length;
      node.progress = completed / children.length;
    }

    result.push(node);

    if (node.isExpanded) {
      children.forEach((c) => {
        traverse(c, depth + 1);
      });
    }
  };

  rootTasks.forEach((t) => {
    traverse(t, 0);
  });
  return result;
}

export function getMonthKey(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
