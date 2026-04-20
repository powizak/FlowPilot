import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { CalendarDays, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  assigneeId: string;
  projectId: string;
}

export function UpcomingDeadlines() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);

        const res = await api.get<{ data: Task[] }>('/tasks', {
          params: {
            dueDateFrom: today.toISOString(),
            dueDateTo: nextWeek.toISOString()
          }
        });
        
        const sortedTasks = (res.data.data || [])
          .filter(t => t.status !== 'done' && t.status !== 'cancelled')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        setTasks(sortedTasks);
      } catch (err) {
        console.error('Failed to fetch upcoming deadlines', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <DashboardCard
      title="Upcoming Deadlines"
      icon={<CalendarDays className="w-5 h-5 text-emerald-500" />}
      isLoading={isLoading}
      isEmpty={tasks.length === 0}
      emptyMessage="No deadlines in the next 7 days."
    >
      <ul className="space-y-3">
        {tasks.slice(0, 6).map(task => {
          const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          let daysLabel = `${daysLeft} days`;
          if (daysLeft === 0) daysLabel = 'Today';
          if (daysLeft === 1) daysLabel = 'Tomorrow';

          return (
            <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex flex-col overflow-hidden mr-4">
                <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-text hover:text-blue-500 truncate transition-colors">
                  {task.name}
                </Link>
                <div className="flex items-center mt-1 text-xs text-text-secondary gap-1">
                  <Clock className="w-3 h-3" />
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider whitespace-nowrap">
                {daysLabel}
              </span>
            </li>
          );
        })}
      </ul>
      {tasks.length > 6 && (
        <div className="mt-4 pt-3 border-t border-border text-center">
          <Link to="/tasks" className="text-sm text-blue-500 hover:text-blue-400 font-medium">
            View all {tasks.length} upcoming tasks
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}
