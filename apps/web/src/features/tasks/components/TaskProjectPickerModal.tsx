import type { TaskProjectOption } from './taskUi';

interface TaskProjectPickerModalProps {
  isOpen: boolean;
  projectSelection: string;
  projects: TaskProjectOption[];
  onProjectSelectionChange: (projectId: string) => void;
  onCancel: () => void;
  onContinue: () => void;
  t: (key: string, fallback: string) => string;
}

export function TaskProjectPickerModal({
  isOpen,
  projectSelection,
  projects,
  onProjectSelectionChange,
  onCancel,
  onContinue,
  t,
}: TaskProjectPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              {t('tasks.newTask', 'New Task')}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {t(
                'tasks.selectProjectForFullEditor',
                'Choose a project first so the full task editor can load the right assignees and workflow data.',
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="tasks-project-picker"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              {t('tasks.project', 'Project')}
            </label>
            <select
              id="tasks-project-picker"
              value={projectSelection}
              onChange={(event) => onProjectSelectionChange(event.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">
                {t('tasks.selectProject', 'Select project')}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 font-medium text-zinc-100 hover:bg-zinc-700"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={!projectSelection}
              onClick={onContinue}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.continue', 'Continue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
