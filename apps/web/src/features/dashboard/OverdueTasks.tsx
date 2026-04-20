import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  assigneeId: string;
  projectId: string;
}

export function OverdueTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        const res = await api.get<{ data: Task[] }>('/tasks', {
          params: {
            dueDateTo: yesterday.toISOString(),
            status: 'todo,in_progress'
          }
        });
        
        setTasks(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch overdue tasks', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <DashboardCard
      title={`Overdue Tasks (${tasks.length})`}
      icon={<AlertCircle className="w-5 h-5 text-red-500" />}
      isLoading={isLoading}
      isEmpty={tasks.length === 0}
      emptyMessage="No overdue tasks. You're all caught up!"
    >
      <ul className="space-y-3">
        {tasks.slice(0, 5).map(task => (
          <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border border-l-4 border-l-red-500">
            <div className="flex flex-col overflow-hidden mr-4">
              <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-text hover:text-blue-500 truncate transition-colors">
                {task.name}
              </Link>
              <div className="flex items-center mt-1 text-xs text-red-400 gap-1 font-medium">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
            <span className="px-2 py-1 text-[10px] font-bold rounded bg-surface text-text-secondary uppercase tracking-wider">
              {task.status.replace('_', ' ')}
            </span>
          </li>
        ))}
      </ul>
      {tasks.length > 5 && (
        <div className="mt-4 pt-3 border-t border-border text-center">
          <Link to="/tasks?filter=overdue" className="text-sm text-blue-500 hover:text-blue-400 font-medium">
            View all {tasks.length} overdue tasks
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}
