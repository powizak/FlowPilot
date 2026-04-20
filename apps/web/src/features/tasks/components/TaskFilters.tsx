import React from 'react';
import { Filter, Calendar, AlertCircle, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FilterType = 'all' | 'my-tasks' | 'due-today' | 'due-week' | 'overdue';

interface TaskFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const filters: { id: FilterType; label: string; icon: React.FC<any> }[] = [
    { id: 'all', label: 'All Tasks', icon: Filter },
    { id: 'my-tasks', label: 'My Tasks', icon: User },
    { id: 'due-today', label: 'Due Today', icon: Calendar },
    { id: 'due-week', label: 'Due This Week', icon: Calendar },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-zinc-800/50 mb-6">
      {filters.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onFilterChange(id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeFilter === id
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
};
