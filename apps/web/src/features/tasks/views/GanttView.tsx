import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { GanttTask, ZoomLevel } from './gantt/GanttTypes';
import { calculateScale, flattenTasks, getMonthKey, addDays } from './gantt/GanttUtils';
import { GanttSidebar } from './gantt/GanttSidebar';
import { GanttTimeline } from './gantt/GanttTimeline';
import { api } from '../../../lib/api';

interface GanttViewProps {
  projectId: string;
}

export const GanttView: React.FC<GanttViewProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: GanttTask[] }>(`/tasks`, {
        params: {
          projectId,
          include: 'dependencies,subtasks',
          limit: 1000,
        },
      });
      setTasks(res.data.data);
      const allIds = new Set<string>();
      res.data.data.forEach((t) => allIds.add(t.id));
      setExpandedIds(allIds);
    } catch (err) {
      console.error('Failed to fetch tasks for Gantt', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flatTasks = useMemo(() => flattenTasks(tasks, expandedIds), [tasks, expandedIds]);
  const scale = useMemo(() => calculateScale(flatTasks, zoom), [flatTasks, zoom]);

  const renderTimelineHeader = () => {
    const { startDate, totalDays, pixelsPerDay } = scale;
    const months: { label: string; days: number }[] = [];
    
    let currentMonth = getMonthKey(startDate);
    let currentMonthDays = 0;
    let currentMonthLabel = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const mKey = getMonthKey(d);
      if (mKey !== currentMonth) {
        months.push({ label: currentMonthLabel, days: currentMonthDays });
        currentMonth = mKey;
        currentMonthDays = 1;
        currentMonthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else {
        currentMonthDays++;
      }
    }
    if (currentMonthDays > 0) months.push({ label: currentMonthLabel, days: currentMonthDays });

    return (
      <div className="flex flex-col h-full bg-zinc-900 text-zinc-400 text-xs select-none">
        <div className="flex h-7 border-b border-zinc-800/50">
          {months.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-center border-r border-zinc-800/50 overflow-hidden px-2"
              style={{ width: m.days * pixelsPerDay }}
            >
              <span className="truncate">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex h-7 relative">
          {Array.from({ length: totalDays }).map((_, i) => {
            const d = addDays(startDate, i);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={i}
                className={`flex items-center justify-center border-r border-zinc-800/50 ${isWeekend ? 'bg-zinc-800/20 text-zinc-500' : ''}`}
                style={{ width: pixelsPerDay, minWidth: pixelsPerDay }}
              >
                {zoom === 'day' || zoom === 'week' ? d.getDate() : ''}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-zinc-500 animate-pulse">Loading Gantt chart...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-sm font-medium text-zinc-300">Gantt View</div>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-1">
          {(['day', 'week', 'month', 'quarter'] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm capitalize transition-colors ${
                zoom === z ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <div style={{ width: scale.totalWidth + 300, minHeight: '100%', position: 'relative' }}>
          
          <div className="sticky top-0 z-40 flex h-14 bg-zinc-900 border-b border-zinc-800 shadow-sm">
            <div className="sticky left-0 z-50 w-[300px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex items-center px-4 font-medium text-xs text-zinc-400 uppercase tracking-wider">
              Task Details
            </div>
            <div className="flex-1 relative overflow-hidden bg-zinc-900">
              {renderTimelineHeader()}
            </div>
          </div>

          <div className="flex relative z-10" style={{ height: Math.max(flatTasks.length * 40, 100) }}>
            <div className="sticky left-0 z-30 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
              <GanttSidebar tasks={flatTasks} onToggleExpand={handleToggleExpand} />
            </div>
            
            <div className="relative shrink-0 bg-zinc-950" style={{ width: scale.totalWidth }}>
              <GanttTimeline tasks={flatTasks} scale={scale} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
