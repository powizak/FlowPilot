import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project, Task, WorkType } from '@flowpilot/shared';
import { api } from '../../lib/api';

interface ManualEntryFormProps {
  projects: Project[];
  tasks: Task[];
  workTypes: WorkType[];
  onSuccess: () => void;
}

export function ManualEntryForm({
  projects,
  tasks,
  workTypes,
  onSuccess,
}: ManualEntryFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date: '',
    projectId: '',
    taskId: '',
    workTypeId: '',
    description: '',
    duration: '',
  });

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
          disabled={!form.projectId}
        >
          <option value="">{t('time.task')}</option>
          {tasks
            .filter((task) => task.projectId === form.projectId)
            .map((task) => (
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
