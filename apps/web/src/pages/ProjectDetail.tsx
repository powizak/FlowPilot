import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { KanbanView } from '../features/tasks/views/KanbanView';
import { ListView } from '../features/tasks/views/ListView';
import { GanttView } from '../features/tasks/views/GanttView';
import { ProjectDashboard } from '../features/projects/ProjectDashboard';
import { AutomationsPage } from '../features/automations/AutomationsPage';
import {
  LayoutList,
  KanbanSquare,
  LayoutDashboard,
  BarChartHorizontal,
  Zap,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewType = 'dashboard' | 'list' | 'kanban' | 'gantt' | 'automations';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<ViewType>('dashboard');

  if (!id) {
    return <div className="p-8 text-red-500">Project ID missing</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800/50 bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-100 mr-4">
          Project Tasks
        </h1>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-1">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              view === 'dashboard'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              view === 'kanban'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <KanbanSquare className="h-4 w-4" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              view === 'list'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <LayoutList className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView('gantt')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              view === 'gantt'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <BarChartHorizontal className="h-4 w-4" />
            Gantt
          </button>
          <button
            type="button"
            onClick={() => setView('automations')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              view === 'automations'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Zap className="h-4 w-4" />
            Automations
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'dashboard' && <ProjectDashboard projectId={id} />}
        {view === 'kanban' && <KanbanView projectId={id} />}
        {view === 'list' && <ListView projectId={id} />}
        {view === 'gantt' && <GanttView projectId={id} />}
        {view === 'automations' && <AutomationsPage projectId={id} />}
      </div>
    </div>
  );
}
