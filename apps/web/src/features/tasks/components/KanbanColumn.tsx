import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@flowpilot/shared';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'Column', status: id } });

  return (
    <div className="flex h-full w-80 flex-col rounded-xl bg-zinc-900/50 p-4 border border-zinc-800/50 flex-shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
          {title}
          <span className="flex h-5 items-center justify-center rounded-full bg-zinc-800 px-2 text-xs font-medium text-zinc-400">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-3 overflow-y-auto min-h-[200px] rounded-lg transition-colors',
          isOver && 'bg-zinc-800/30'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        
        <button
          onClick={() => onAddTask(id)}
          className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 py-3 px-4 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>
    </div>
  );
};
