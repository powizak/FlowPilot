import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Play, Square } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
}

interface WorkType {
  id: string;
  name: string;
}

export function TimerWidget() {
  const { t } = useTranslation();
  const [runningEntry, setRunningEntry] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  const [form, setForm] = useState({
    projectId: '',
    taskId: '',
    workTypeId: '',
    description: '',
  });

  const fetchRunning = useCallback(async () => {
    try {
      const res = await api.get('/time-entries/running');
      if (res.data) {
        setRunningEntry(res.data);
      } else {
        setRunningEntry(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        api.get('/projects'),
        api.get('/work-types'),
      ]);
      setProjects(pRes.data);
      setWorkTypes(wRes.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRunning();
    fetchDropdowns();
  }, [fetchDropdowns, fetchRunning]);

  useEffect(() => {
    if (form.projectId) {
      api
        .get(`/tasks?projectId=${form.projectId}`)
        .then((res) => setTasks(res.data))
        .catch(console.error);
    } else {
      setTasks([]);
    }
  }, [form.projectId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (runningEntry && runningEntry.startedAt) {
      interval = setInterval(() => {
        const start = new Date(runningEntry.startedAt).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runningEntry]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStart = async () => {
    if (!form.projectId || !form.workTypeId) return;
    try {
      await api.post('/time-entries/start', form);
      setOpen(false);
      fetchRunning();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async () => {
    try {
      await api.post('/time-entries/stop');
      setRunningEntry(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary cursor-pointer hover:bg-hover"
        onClick={() => !runningEntry && setOpen(!open)}
      >
        {runningEntry ? (
          <>
            <span className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="mr-3">
              {runningEntry.project?.name || ''} {formatTime(elapsed)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
              className="hover:text-red-400"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            <span>{t('time.noRunningTimer')}</span>
          </>
        )}
      </button>

      {open && !runningEntry && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-border bg-background p-4 shadow-lg z-50">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="timer-project"
                className="text-xs text-text-secondary"
              >
                {t('time.project')}
              </label>
              <select
                id="timer-project"
                className="w-full bg-background border border-border rounded p-1 text-sm text-foreground"
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
              >
                <option value="">--</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="timer-task"
                className="text-xs text-text-secondary"
              >
                {t('time.task')}
              </label>
              <select
                id="timer-task"
                className="w-full bg-background border border-border rounded p-1 text-sm text-foreground"
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              >
                <option value="">--</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="timer-work-type"
                className="text-xs text-text-secondary"
              >
                {t('time.workType')}
              </label>
              <select
                id="timer-work-type"
                className="w-full bg-background border border-border rounded p-1 text-sm text-foreground"
                value={form.workTypeId}
                onChange={(e) =>
                  setForm({ ...form, workTypeId: e.target.value })
                }
              >
                <option value="">--</option>
                {workTypes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="timer-description"
                className="text-xs text-text-secondary"
              >
                {t('time.description')}
              </label>
              <input
                id="timer-description"
                type="text"
                className="w-full bg-background border border-border rounded p-1 text-sm text-foreground"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded p-1.5 text-sm font-medium"
              onClick={handleStart}
            >
              {t('time.startTimer')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
