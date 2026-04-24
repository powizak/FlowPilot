import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Project, Task, WorkType } from '@flowpilot/shared';
import { api } from '../../lib/api';

interface ManualEntryFormProps {
  projects: Project[];
  workTypes: WorkType[];
  onSuccess: () => void;
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ManualEntryForm({
  projects,
  workTypes,
  onSuccess,
}: ManualEntryFormProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') ?? '';
  const initialTaskId = searchParams.get('taskId') ?? '';
  const [form, setForm] = useState({
    date: todayIso(),
    projectId: initialProjectId,
    taskId: initialTaskId,
    workTypeId: '',
    description: '',
    duration: '',
  });
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (!form.projectId) {
      setProjectTasks([]);
      return;
    }
    let cancelled = false;
    setLoadingTasks(true);
    api
      .get<{ data: Task[] }>(`/projects/${form.projectId}/tasks`, {
        params: { limit: 200 },
      })
      .then((res) => {
        if (!cancelled) {
          const tasks = res.data.data ?? [];
          setProjectTasks(tasks);
          if (
            form.taskId !== '' &&
            !tasks.some((task) => task.id === form.taskId)
          ) {
            setForm((current) => ({ ...current, taskId: '' }));
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load project tasks', err);
          setProjectTasks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTasks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.projectId, form.taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startedAt = new Date(form.date).toISOString();
      const endedAt = new Date(
        new Date(form.date).getTime() + Number(form.duration) * 60000,
      ).toISOString();
      await api.post('/time-entries', {
        projectId: form.projectId,
        taskId: form.taskId || undefined,
        workTypeId: form.workTypeId,
        description: form.description,
        startedAt,
        endedAt,
        isBillable: true,
      });
      onSuccess();
      setForm({
        date: todayIso(),
        projectId: '',
        taskId: '',
        workTypeId: '',
        description: '',
        duration: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-background p-6"
    >
      <h3 className="text-lg font-medium">{t('time.manualEntry')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="date"
          required
          className="bg-background border border-border rounded p-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="number"
          required
          placeholder={t('time.duration') + ' (min)'}
          className="bg-background border border-border rounded p-2"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
        <select
          required
          className="bg-background border border-border rounded p-2"
          value={form.projectId}
          onChange={(e) =>
            setForm({ ...form, projectId: e.target.value, taskId: '' })
          }
        >
          <option value="">{t('time.project')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="bg-background border border-border rounded p-2"
          value={form.taskId}
          onChange={(e) => setForm({ ...form, taskId: e.target.value })}
          disabled={!form.projectId || loadingTasks}
        >
          <option value="">
            {loadingTasks ? t('common.loading') : t('time.task')}
          </option>
          {projectTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
        <select
          required
          className="bg-background border border-border rounded p-2"
          value={form.workTypeId}
          onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
        >
          <option value="">{t('time.workType')}</option>
          {workTypes.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t('time.description')}
          className="col-span-2 bg-background border border-border rounded p-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
      >
        {t('common.submit')}
      </button>
    </form>
  );
}
