import { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';
import { TimeEntry } from '@flowpilot/shared';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AIActionButton } from '../../components/AIActionButton';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectStats {
  budgetHours: number | null;
  actualHours: number;
  budgetAmount: number | null;
  actualAmount: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionPercent: number;
}

interface ProjectMemberView {
  userId: string;
  role: string;
  user: { id: string; email: string; name: string };
}

interface ProjectView {
  id: string;
  name: string;
  status: string;
  billingType: string;
  members: ProjectMemberView[];
  stats: ProjectStats;
}

interface ReportItem {
  key: string;
  label: string;
  durationMinutes: number;
  billingAmount: number;
  count: number;
}

interface DashboardTask {
  id: string;
  title: string;
  status: string;
  dueDate: Date | string | null;
}

interface GeneratedProjectTasksResult {
  tasks?: { name: string; description?: string }[];
}

const COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
];

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectView | null>(null);
  const [timeBreakdown, setTimeBreakdown] = useState<ReportItem[]>([]);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<DashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [projRes, reportRes, entriesRes, tasksRes] = await Promise.all([
          api.get<{ data: ProjectView }>(`/projects/${projectId}`),
          api.get<{ data: ReportItem[] }>(`/time-entries/report`, {
            params: { projectId, groupBy: 'workType' },
          }),
          api.get<{ data: TimeEntry[] }>(`/time-entries`, {
            params: { projectId, limit: 10, page: 1 },
          }),
          api.get<{ data: DashboardTask[] }>(`/projects/${projectId}/tasks`, {
            params: { limit: 100 },
          }),
        ]);

        setProject(projRes.data.data);
        setTimeBreakdown(reportRes.data.data);

        const entries = Array.isArray(entriesRes.data.data)
          ? entriesRes.data.data
          : [];
        setRecentEntries(entries.slice(0, 10));

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const tasks = Array.isArray(tasksRes.data.data)
          ? tasksRes.data.data
          : [];
        const overdue = tasks.filter((t) => {
          if (!t.dueDate || t.status === 'done' || t.status === 'cancelled')
            return false;
          const d = new Date(t.dueDate);
          d.setHours(0, 0, 0, 0);
          return d < now;
        });
        setOverdueTasks(overdue);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const pieData = useMemo(() => {
    return timeBreakdown.map((item) => ({
      name: item.label || 'Uncategorized',
      value: Math.round((item.durationMinutes / 60) * 10) / 10,
    }));
  }, [timeBreakdown]);

  if (isLoading || !project) {
    return <div className="p-6 text-zinc-400">Loading dashboard...</div>;
  }

  const { stats, members } = project;
  const hoursUsedPct = stats.budgetHours
    ? Math.min(100, Math.round((stats.actualHours / stats.budgetHours) * 100))
    : 0;
  const amountUsedPct = stats.budgetAmount
    ? Math.min(100, Math.round((stats.actualAmount / stats.budgetAmount) * 100))
    : 0;

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">
            {project.name} Dashboard
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
            {project.status.replace('_', ' ')}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
            {project.billingType}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AIActionButton<GeneratedProjectTasksResult>
            skillId="task-decomposition"
            label="AI Generate Tasks"
            context={{
              projectName: project.name,
              description: 'Generate initial tasks for this project',
            }}
            previewTitle="Generated Tasks"
            onResult={(result) => {
              console.log('Would create project tasks:', result);
            }}
            previewRenderer={(result) => (
              <ul className="list-disc pl-4 space-y-2 text-sm text-zinc-200">
                {(result.tasks || []).map(
                  (t: { name: string; description?: string }) => (
                    <li key={`${t.name}-${t.description ?? ''}`}>
                      <strong>{t.name}</strong>
                      {t.description && (
                        <p className="text-xs text-zinc-400 mt-1">
                          {t.description}
                        </p>
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Budget vs Actual
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-zinc-400">Hours</span>
              <span className="text-zinc-200">
                {stats.actualHours.toFixed(1)} / {stats.budgetHours || '∞'}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  hoursUsedPct > 90 ? 'bg-red-500' : 'bg-blue-500',
                )}
                style={{ width: `${hoursUsedPct}%` }}
              />
            </div>
          </div>

          {project.billingType !== 'hourly' && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-zinc-400">Amount</span>
                <span className="text-zinc-200">
                  ${stats.actualAmount.toFixed(2)} / $
                  {stats.budgetAmount || '∞'}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    amountUsedPct > 90 ? 'bg-red-500' : 'bg-green-500',
                  )}
                  style={{ width: `${amountUsedPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg w-full mb-2">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            Task Completion
          </div>
          <div className="h-32 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Done', value: stats.completedTasks },
                    {
                      name: 'Pending',
                      value: stats.totalTasks - stats.completedTasks,
                    },
                  ]}
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3f3f46" />
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    color: '#e4e4e7',
                  }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-2">
              <span className="text-xl font-bold text-zinc-100">
                {stats.taskCompletionPercent}%
              </span>
            </div>
          </div>
          <div className="text-sm text-zinc-400 mt-2">
            {stats.completedTasks} of {stats.totalTasks} tasks done
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg w-full mb-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Time by Work Type
          </div>
          {pieData.length > 0 ? (
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[pieData.indexOf(entry) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      color: '#e4e4e7',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              No time logged yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg mb-4">
            <Activity className="w-5 h-5 text-pink-400" />
            Recent Activity
          </div>
          <div className="flex flex-col gap-3">
            {recentEntries.length === 0 ? (
              <span className="text-sm text-zinc-500">No recent activity.</span>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center text-sm p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-200 font-medium">
                      {entry.description || 'Time entry'}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {new Date(entry.startedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-zinc-300 font-medium">
                    {entry.durationMinutes
                      ? (entry.durationMinutes / 60).toFixed(2) + 'h'
                      : 'Running...'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Overdue Tasks
            </div>
            <div className="flex flex-col gap-2">
              {overdueTasks.length === 0 ? (
                <span className="text-sm text-zinc-500">
                  No overdue tasks. Great job!
                </span>
              ) : (
                overdueTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-200"
                  >
                    <span className="truncate pr-4">{task.title}</span>
                    <span className="text-xs whitespace-nowrap opacity-80">
                      Due:{' '}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg mb-4">
              <Users className="w-5 h-5 text-indigo-400" />
              Team
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-2 border border-zinc-800 rounded-lg bg-zinc-950/50"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs">
                    {member.user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-zinc-200 truncate">
                      {member.user.name}
                    </span>
                    <span className="text-xs text-zinc-500 capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
