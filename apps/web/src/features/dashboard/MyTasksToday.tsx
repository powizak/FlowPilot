import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { CheckCircle2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  assigneeId: string;
  projectId: string;
}

export function MyTasksToday() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const res = await api.get<{ data: Task[] }>('/tasks', {
          params: {
            assigneeId: user.id,
            dueDateTo: today.toISOString(),
            status: 'todo,in_progress'
          }
        });
        
        setTasks(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <DashboardCard
      title="My Tasks Today"
      icon={<CheckCircle2 className="w-5 h-5" />}
      isLoading={isLoading}
      isEmpty={tasks.length === 0}
      emptyMessage="No tasks due today. Great job!"
    >
      <ul className="space-y-3">
        {tasks.map(task => {
          const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
          return (
            <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex flex-col overflow-hidden mr-4">
                <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-text hover:text-blue-500 truncate transition-colors">
                  {task.name}
                </Link>
                <div className="flex items-center mt-1 text-xs text-text-secondary gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500 uppercase whitespace-nowrap">
                {task.status.replace('_', ' ')}
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
