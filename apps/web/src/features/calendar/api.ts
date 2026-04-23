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
  clientId?: string | null;
  clientName?: string | null;
}

interface ApiProject {
  id: string;
  name: string;
  clientId?: string | null;
}

interface ApiClient {
  id: string;
  name: string;
}

interface ApiTask {
  id: string;
  title: string;
  projectId: string;
  dueDate: string | null;
  status: string;
}

interface ApiTimeEntry {
  id: string;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  projectId: string | null;
}

interface Envelope<T> {
  data: T;
}

function unwrap<T>(payload: Envelope<T> | undefined, fallback: T): T {
  if (payload === undefined || payload === null) return fallback;
  return payload.data ?? fallback;
}

function toCalendarTask(task: ApiTask): Task | null {
  if (task.dueDate === null) return null;
  return {
    id: task.id,
    name: task.title,
    projectId: task.projectId,
    dueDate: task.dueDate,
    status: task.status,
  };
}

function toCalendarTimeEntry(entry: ApiTimeEntry): TimeEntry | null {
  if (entry.endedAt === null) return null;
  return {
    id: entry.id,
    description: entry.description ?? '',
    startTime: entry.startedAt,
    endTime: entry.endedAt,
    projectId: entry.projectId ?? undefined,
  };
}

export async function fetchCalendarData(
  userId: string | undefined,
  from: string,
  to: string,
) {
  const [tasksRes, timeRes, projectsRes, clientsRes] = await Promise.all([
    api
      .get<Envelope<ApiTask[]>>('/tasks/my', {
        params: { dueDateFrom: from, dueDateTo: to, limit: 100 },
      })
      .catch(() => ({ data: { data: [] as ApiTask[] } })),
    api
      .get<Envelope<ApiTimeEntry[]>>('/time-entries', {
        params: { dateFrom: from, dateTo: to, userId, limit: 100 },
      })
      .catch(() => ({ data: { data: [] as ApiTimeEntry[] } })),
    api
      .get<Envelope<ApiProject[]>>('/projects', { params: { limit: 100 } })
      .catch(() => ({ data: { data: [] as ApiProject[] } })),
    api
      .get<Envelope<ApiClient[]>>('/clients', { params: { limit: 200 } })
      .catch(() => ({ data: { data: [] as ApiClient[] } })),
  ]);

  const tasks = unwrap(tasksRes.data, [] as ApiTask[])
    .map(toCalendarTask)
    .filter((task): task is Task => task !== null);

  const timeEntries = unwrap(timeRes.data, [] as ApiTimeEntry[])
    .map(toCalendarTimeEntry)
    .filter((entry): entry is TimeEntry => entry !== null);

  const rawProjects = unwrap(projectsRes.data, [] as ApiProject[]);
  const rawClients = unwrap(clientsRes.data, [] as ApiClient[]);
  const clientNameById = new Map(rawClients.map((c) => [c.id, c.name]));
  const projects: Project[] = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.clientId ?? null,
    clientName: p.clientId ? (clientNameById.get(p.clientId) ?? null) : null,
  }));

  return { tasks, timeEntries, projects };
}
