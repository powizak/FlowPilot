interface Project {
  id: string;
  name: string;
}

interface TaskProjectPickerModalProps {
  isOpen: boolean;
  projectSelection: string;
  projects: Project[];
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-text">
              {t('tasks.newTask', 'New Task')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t(
                'tasks.selectProjectForFullEditor',
                'Choose a project first so the full task editor can load the right assignees and workflow data.',
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="tasks-project-picker"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              {t('tasks.project', 'Project')}
            </label>
            <select
              id="tasks-project-picker"
              value={projectSelection}
              onChange={(event) => onProjectSelectionChange(event.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text focus:border-violet-500 focus:outline-none"
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
              className="px-4 py-2 font-medium text-text-secondary hover:text-text"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={!projectSelection}
              onClick={onContinue}
              className="rounded bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.continue', 'Continue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
