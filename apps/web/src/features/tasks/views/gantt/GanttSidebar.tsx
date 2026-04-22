import React from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { GanttTask } from './GanttTypes';

interface Props {
  tasks: GanttTask[];
  onToggleExpand: (id: string) => void;
}

export const GanttSidebar: React.FC<Props> = ({ tasks, onToggleExpand }) => {
  return (
    <div className="w-[300px] shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {tasks.map((t) => (
        <div
          key={t.id}
          className="h-[40px] flex flex-col justify-center px-3 border-b border-zinc-800/50 hover:bg-zinc-800/20"
        >
          <div
            className="flex items-center text-sm text-zinc-200"
            style={{ paddingLeft: `${(t.depth || 0) * 16}px` }}
          >
            {t.hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(t.id)}
                className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 mr-1 shrink-0"
              >
                {t.isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            <div className="flex-1 truncate mr-2 font-medium" title={t.name}>
              {t.name}
            </div>

            {t.assigneeId && (
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 shrink-0">
                <User size={10} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
