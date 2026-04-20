import React from 'react';
import { isSameDay, formatTime, getProjectColor } from './utils';
import { Task, TimeEntry, Project } from './api';
import { cn } from '../../lib/utils';

interface DayViewProps {
  date: Date;
  timeEntries: TimeEntry[];
  projects: Project[];
}

export function DayView({ date, timeEntries, projects }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEntries = timeEntries.filter(t => isSameDay(new Date(t.startTime), date));

  return (
    <div className="flex flex-1 h-full min-h-0 border border-border rounded-lg overflow-hidden bg-background">
      <div className="w-16 border-r border-border bg-sidebar shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {hours.map((h) => (
            <div key={h} className="h-16 border-b border-border text-xs text-text-secondary text-right pr-2 pt-1.5 font-medium select-none">
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="absolute inset-0 z-0">
          {hours.map((h) => <div key={h} className="h-16 border-b border-border/50" />)}
        </div>
        
        {dayEntries.map(entry => {
          const start = new Date(entry.startTime);
          const end = new Date(entry.endTime);
          const startMins = start.getHours() * 60 + start.getMinutes();
          const durationMins = (end.getTime() - start.getTime()) / 60000;
          
          const top = (startMins / 60) * 64;
          const height = Math.max((durationMins / 60) * 64, 16);
          const project = projects.find(p => p.id === entry.projectId);
          const colorClass = project?.color || getProjectColor(entry.projectId || '');

          return (
            <div
              key={entry.id}
              className={cn("absolute left-2 right-4 rounded-md border border-background z-10 p-2 text-xs overflow-hidden shadow", colorClass)}
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <div className="font-semibold text-white/90">{entry.description || 'No description'}</div>
              {height >= 32 && (
                <div className="text-white/70 mt-1">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
