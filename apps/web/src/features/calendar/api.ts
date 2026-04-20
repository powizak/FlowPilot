import { api } from '../../lib/api';

export interface Task {
  id: string;
  name: string;
  projectId?: string;
  dueDate: string;
  status: string;
}

export interface TimeEntry {
  id: string;
  description: string;
  startTime: string;
  endTime: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
}

export async function fetchCalendarData(userId: string | undefined, from: string, to: string) {
  const [tasksRes, timeRes, projectsRes] = await Promise.all([
    api.get('/tasks', { 
      params: { assigneeId: userId, dueDateFrom: from, dueDateTo: to }
    }).catch(() => ({ data: [] })),
    api.get('/time-entries', { 
      params: { from, to, userId }
    }).catch(() => ({ data: [] })),
    api.get('/projects').catch(() => ({ data: [] }))
  ]);

  return {
    tasks: tasksRes.data as Task[],
    timeEntries: timeRes.data as TimeEntry[],
    projects: projectsRes.data as Project[]
  };
}
