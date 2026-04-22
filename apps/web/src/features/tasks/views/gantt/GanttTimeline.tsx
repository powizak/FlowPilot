import React from 'react';
import { GanttTask, GanttScale } from './GanttTypes';
import { diffDays } from './GanttUtils';

interface Props {
  tasks: GanttTask[];
  scale: GanttScale;
}

export const GanttTimeline: React.FC<Props> = ({ tasks, scale }) => {
  const { pixelsPerDay, startDate, totalWidth, totalDays } = scale;
  const rowHeight = 40;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayX = diffDays(startDate, today) * pixelsPerDay;

  const dayDates = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getTaskCoords = (t: GanttTask, index: number) => {
    const sDate = t.startDate ? new Date(t.startDate) : new Date(today);
    const dDate = t.dueDate ? new Date(t.dueDate) : new Date(sDate);

    sDate.setHours(0, 0, 0, 0);
    dDate.setHours(0, 0, 0, 0);

    const x = diffDays(startDate, sDate) * pixelsPerDay;
    const w = Math.max(diffDays(sDate, dDate) * pixelsPerDay, pixelsPerDay);
    const y = index * rowHeight + 10;
    const h = 20;

    return { x, w, y, h, sDate, dDate };
  };

  const coordsMap = new Map<string, ReturnType<typeof getTaskCoords>>();
  tasks.forEach((task, index) => {
    coordsMap.set(task.id, getTaskCoords(task, index));
  });

  const renderDependencies = () => {
    const lines: React.ReactNode[] = [];
    tasks.forEach((t) => {
      if (t.dependencies) {
        t.dependencies.forEach((dep) => {
          const from = coordsMap.get(dep.dependsOnId);
          const to = coordsMap.get(t.id);
          if (from && to) {
            const startX = from.x + from.w;
            const startY = from.y + from.h / 2;
            const endX = to.x;
            const endY = to.y + to.h / 2;

            const path = `M ${startX} ${startY} C ${startX + 15} ${startY}, ${endX - 15} ${endY}, ${endX} ${endY}`;
            lines.push(
              <path
                key={`dep-${dep.dependsOnId}-${t.id}`}
                d={path}
                fill="none"
                stroke="#52525b"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />,
            );
          }
        });
      }
    });
    return lines;
  };

  return (
    <div className="relative" style={{ width: totalWidth, height: '100%' }}>
      <svg
        width="100%"
        height={tasks.length * rowHeight}
        className="absolute inset-0 block pointer-events-none z-10"
        aria-label="Gantt timeline"
      >
        <title>Gantt timeline</title>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
          </marker>
        </defs>

        {dayDates.map((day) => (
          <line
            key={`grid-${day.toISOString()}`}
            x1={diffDays(startDate, day) * pixelsPerDay}
            y1={0}
            x2={diffDays(startDate, day) * pixelsPerDay}
            y2={tasks.length * rowHeight}
            stroke="#27272a"
            strokeWidth="1"
          />
        ))}

        {todayX >= 0 && todayX <= totalWidth && (
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={tasks.length * rowHeight}
            stroke="#ef4444"
            strokeWidth="2"
            className="z-20"
          />
        )}

        {renderDependencies()}

        {tasks.map((t) => {
          const { x, w, y, h, sDate, dDate } = coordsMap.get(t.id)!;
          const isMilestone =
            t.startDate && t.dueDate && sDate.getTime() === dDate.getTime();

          let fill = '#52525b';
          if (t.status === 'in_progress') fill = '#3b82f6';
          else if (t.status === 'done') fill = '#22c55e';
          else if (t.status === 'cancelled') fill = '#ef4444';

          const progressW = w * (t.progress || 0);

          if (isMilestone) {
            const diamondPath = `M ${x} ${y + h / 2} L ${x + h / 2} ${y} L ${x + h} ${y + h / 2} L ${x + h / 2} ${y + h} Z`;
            return (
              <path
                key={`bar-${t.id}`}
                d={diamondPath}
                fill={fill}
                className="pointer-events-auto"
              />
            );
          }

          return (
            <g
              key={`bar-${t.id}`}
              className="pointer-events-auto cursor-pointer hover:opacity-80"
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={fill}
                rx="4"
                opacity={0.3}
              />
              <rect
                x={x}
                y={y}
                width={progressW}
                height={h}
                fill={fill}
                rx="4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
