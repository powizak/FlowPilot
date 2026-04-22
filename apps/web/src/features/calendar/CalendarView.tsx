import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CreateTaskModal } from './CreateTaskModal';
import { fetchCalendarData, Task, TimeEntry, Project } from './api';
import {
  getMonthGrid,
  getWeekDays,
  getDaysInMonth,
  formatISODate,
  getProjectColor,
} from './utils';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView() {
  useTranslation();
  const { user } = useAuthStore();
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      let fromDate: Date;
      let toDate: Date;

      if (view === 'month') {
        fromDate = new Date(year, month, 1);
        toDate = new Date(year, month, getDaysInMonth(year, month));
      } else if (view === 'week') {
        const week = getWeekDays(currentDate);
        fromDate = week[0].date;
        toDate = week[6].date;
      } else {
        fromDate = new Date(currentDate);
        toDate = new Date(currentDate);
      }

      fromDate.setDate(fromDate.getDate() - 7);
      toDate.setDate(toDate.getDate() + 7);

      const data = await fetchCalendarData(
        user?.id,
        formatISODate(fromDate),
        formatISODate(toDate),
      );

      setTasks(data.tasks);
      setTimeEntries(data.timeEntries);
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, user?.id, view]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(next.getMonth() - 1);
      else if (view === 'week') next.setDate(next.getDate() - 7);
      else next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(next.getMonth() + 1);
      else if (view === 'week') next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const formatPeriod = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString([], {
        month: 'long',
        year: 'numeric',
      });
    }
    if (view === 'week') {
      const week = getWeekDays(currentDate);
      return `${week[0].date.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${week[6].date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full p-8 max-w-screen-2xl mx-auto text-foreground overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-accent" />
            Calendar
          </h1>
          <div className="flex items-center gap-2 bg-sidebar border border-border rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 hover:bg-hover rounded text-text-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-sm font-medium hover:bg-hover rounded text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 hover:bg-hover rounded text-text-secondary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <span className="text-lg font-medium text-text-secondary ml-2">
            {formatPeriod()}
          </span>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden bg-sidebar p-1 gap-1">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded capitalize transition-colors ${view === v ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-foreground hover:bg-hover'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col bg-background rounded-lg shadow-sm">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        )}

        {view === 'month' && (
          <MonthView
            grid={getMonthGrid(
              currentDate.getFullYear(),
              currentDate.getMonth(),
            )}
            tasks={tasks}
            projects={projects}
            onDateClick={handleDateClick}
            onTaskClick={(task) => alert(`Task: ${task.name}`)}
          />
        )}
        {view === 'week' && (
          <WeekView
            week={getWeekDays(currentDate)}
            timeEntries={timeEntries}
            projects={projects}
            onDateClick={handleDateClick}
          />
        )}
        {view === 'day' && (
          <DayView
            date={currentDate}
            timeEntries={timeEntries}
            projects={projects}
          />
        )}
      </div>

      {projects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 items-center text-xs text-text-secondary shrink-0">
          <span className="font-medium">Projects:</span>
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${p.color || getProjectColor(p.id)}`}
              />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate}
        projects={projects}
        userId={user?.id}
        onSuccess={loadData}
      />
    </div>
  );
}

export default CalendarView;
