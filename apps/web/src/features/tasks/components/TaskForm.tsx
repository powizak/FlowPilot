import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TaskFormData {
  title: string;
  projectId: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  projects: { id: string; name: string }[];
  onSave: (data: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({
  initialData,
  projects,
  onSave,
  onCancel,
  isLoading,
}: TaskFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    projectId: initialData?.projectId || '',
    status: initialData?.status || 'todo',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate ? initialData.dueDate.split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) return;
    onSave({
      ...formData,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg border border-border w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-text">
          {initialData?.title ? t('tasks.editTask') : t('tasks.newTask')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('tasks.title')} *
            </label>
            <input
              id="task-title"
              type="text"
              required
              className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-violet-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="task-project"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('tasks.project')} *
            </label>
            <select
              id="task-project"
              required
              disabled={!!initialData?.projectId}
              className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-violet-500 disabled:opacity-50"
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
            >
              <option value="">{t('tasks.selectProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t('tasks.status')}
              </label>
              <select
                id="task-status"
                className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-violet-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="backlog">{t('tasks.statusBacklog')}</option>
                <option value="todo">{t('tasks.statusTodo')}</option>
                <option value="in_progress">
                  {t('tasks.statusInProgress')}
                </option>
                <option value="review">{t('tasks.statusReview')}</option>
                <option value="done">{t('tasks.statusDone')}</option>
                <option value="cancelled">{t('tasks.statusCancelled')}</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t('tasks.priority')}
              </label>
              <select
                id="task-priority"
                className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-violet-500"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="none">{t('tasks.priorityNone')}</option>
                <option value="low">{t('tasks.priorityLow')}</option>
                <option value="medium">{t('tasks.priorityMedium')}</option>
                <option value="high">{t('tasks.priorityHigh')}</option>
                <option value="urgent">{t('tasks.priorityUrgent')}</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-due-date"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('tasks.dueDate')}
            </label>
            <input
              id="task-due-date"
              type="date"
              className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-violet-500 text-sm"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-text-secondary hover:text-text font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title || !formData.projectId}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded font-medium disabled:opacity-50"
            >
              {isLoading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
