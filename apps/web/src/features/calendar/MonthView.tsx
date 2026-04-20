import React from 'react';
import { isSameDay, getProjectColor } from './utils';
import { Task, Project } from './api';
import { cn } from '../../lib/utils';

interface MonthViewProps {
  grid: { date: Date; isCurrentMonth: boolean; isoString: string }[];
  tasks: Task[];
  projects: Project[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export function MonthView({ grid, tasks, projects, onDateClick, onTaskClick }: MonthViewProps) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-7 border-b border-border bg-sidebar text-text-secondary text-sm font-medium">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-border gap-px">
        {grid.map((cell, i) => {
          const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), cell.date));
          const isToday = isSameDay(new Date(), cell.date);

          return (
            <div 
              key={i} 
              className={cn(
                "bg-background p-1 flex flex-col min-h-[100px] cursor-pointer hover:bg-hover transition-colors overflow-hidden",
                !cell.isCurrentMonth && "opacity-40"
              )}
              onClick={() => onDateClick(cell.date)}
            >
              <div className="text-right mb-1">
                <span className={cn(
                  "text-xs font-medium w-6 h-6 inline-flex items-center justify-center rounded-full",
                  isToday ? "bg-accent text-white" : "text-foreground"
                )}>
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {dayTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const colorClass = project?.color || getProjectColor(task.projectId || '');
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded flex items-center gap-1.5 bg-sidebar text-foreground border border-border hover:border-accent"
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", colorClass)} />
                      <span className="truncate">{task.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
