import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@flowpilot/shared';
import { Clock, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  none: 'bg-zinc-500',
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        'group relative flex cursor-grab flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h4 className="text-sm font-medium text-zinc-100 line-clamp-2">{task.name}</h4>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <div
            className={cn('h-2 w-2 rounded-full', PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none)}
            title={`Priority: ${task.priority}`}
          />
          {task.estimatedHours != null && (
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-400' : 'text-zinc-400'
              )}
            >
              <AlertCircle className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.assigneeId && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 ring-1 ring-zinc-700">
              {task.assigneeId.substring(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
