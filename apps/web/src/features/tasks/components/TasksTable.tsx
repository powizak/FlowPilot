import type { Task } from '@flowpilot/shared';
import {
  getTaskPriorityTranslation,
  getTaskStatusTranslation,
  type TaskProjectOption,
} from './taskUi';

interface TasksTableProps {
  tasks: Task[];
  projects: TaskProjectOption[];
  isViewer: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  t: (key: string, fallback: string) => string;
}

export function TasksTable({
  tasks,
  projects,
  isViewer,
  onEdit,
  onDelete,
  t,
}: TasksTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
          <tr>
            <th className="px-6 py-3 font-medium">
              {t('tasks.title', 'Title')}
            </th>
            <th className="px-6 py-3 font-medium">
              {t('tasks.project', 'Project')}
            </th>
            <th className="px-6 py-3 font-medium">
              {t('tasks.status', 'Status')}
            </th>
            <th className="px-6 py-3 font-medium">
              {t('tasks.priority', 'Priority')}
            </th>
            <th className="px-6 py-3 font-medium">
              {t('tasks.dueDate', 'Due Date')}
            </th>
            {!isViewer && (
              <th className="px-6 py-3 text-right font-medium">
                {t('common.actions', 'Actions')}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="transition-colors hover:bg-zinc-800/60"
            >
              <td className="px-6 py-4 font-medium text-zinc-100">
                {task.name}
              </td>
              <td className="px-6 py-4 text-zinc-400">
                {projects.find((project) => project.id === task.projectId)
                  ?.name || '-'}
              </td>
              <td className="px-6 py-4 text-zinc-400">
                {(() => {
                  const translation = getTaskStatusTranslation(task.status);
                  return t(translation.key, translation.fallback);
                })()}
              </td>
              <td className="px-6 py-4 text-zinc-400">
                {(() => {
                  const translation = getTaskPriorityTranslation(task.priority);
                  return t(translation.key, translation.fallback);
                })()}
              </td>
              <td className="px-6 py-4 text-zinc-400">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : '-'}
              </td>
              {!isViewer && (
                <td className="space-x-3 px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="font-medium text-violet-500 hover:text-violet-400"
                  >
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="font-medium text-red-500 hover:text-red-400"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
