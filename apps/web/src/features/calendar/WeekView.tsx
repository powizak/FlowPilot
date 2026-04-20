import React from 'react';
import { isSameDay, formatTime, getProjectColor } from './utils';
import { Task, TimeEntry, Project } from './api';
import { cn } from '../../lib/utils';

interface WeekViewProps {
  week: { date: Date; isoString: string }[];
  timeEntries: TimeEntry[];
  projects: Project[];
  onDateClick: (date: Date) => void;
}

export function WeekView({ week, timeEntries, projects, onDateClick }: WeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-1 h-full min-h-0 border border-border rounded-lg overflow-hidden bg-background">
      <div className="w-16 border-r border-border bg-sidebar shrink-0 relative overflow-hidden flex flex-col">
        <div className="h-12 border-b border-border bg-sidebar" />
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none">
            {hours.map((h) => (
              <div key={h} className="h-12 border-b border-border text-[10px] text-text-secondary text-right pr-2 pt-1 font-medium select-none">
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {week.map((day, i) => {
          const isToday = isSameDay(new Date(), day.date);
          const dayEntries = timeEntries.filter(t => isSameDay(new Date(t.startTime), day.date));

          return (
            <div key={i} className="flex-1 border-r border-border last:border-r-0 flex flex-col min-w-[100px] relative cursor-pointer" onClick={() => onDateClick(day.date)}>
              <div className={cn(
                "h-12 border-b border-border bg-sidebar flex flex-col items-center justify-center p-1 font-medium",
                isToday ? "text-accent" : "text-text-secondary"
              )}>
                <div className="text-xs uppercase">{day.date.toLocaleDateString([], { weekday: 'short' })}</div>
                <div className={cn(
                  "text-lg w-7 h-7 flex items-center justify-center rounded-full mt-0.5",
                  isToday ? "bg-accent text-white" : "text-foreground"
                )}>
                  {day.date.getDate()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="absolute inset-0 z-0">
                  {hours.map((h) => <div key={h} className="h-12 border-b border-border/50" />)}
                </div>
                
                {dayEntries.map(entry => {
                  const start = new Date(entry.startTime);
                  const end = new Date(entry.endTime);
                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const durationMins = (end.getTime() - start.getTime()) / 60000;
                  
                  const top = (startMins / 60) * 48;
                  const height = Math.max((durationMins / 60) * 48, 12);
                  const project = projects.find(p => p.id === entry.projectId);
                  const colorClass = project?.color || getProjectColor(entry.projectId || '');

                  return (
                    <div
                      key={entry.id}
                      className={cn("absolute left-1 right-1 rounded border border-background z-10 p-1 text-[10px] overflow-hidden shadow-sm", colorClass)}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={`${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}\n${entry.description}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-semibold text-white/90 truncate leading-tight">{entry.description || 'No description'}</div>
                      {height >= 24 && (
                        <div className="text-white/70 truncate text-[9px] mt-0.5">{formatTime(entry.startTime)}</div>
                      )}
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
