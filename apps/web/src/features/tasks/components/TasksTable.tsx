import type { Task, TaskStatus } from '@flowpilot/shared';

interface Project {
  id: string;
  name: string;
}

interface TasksTableProps {
  tasks: Task[];
  projects: Project[];
  isViewer: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  t: (key: string, fallback: string) => string;
}

function getStatusLabel(
  status: TaskStatus,
  t: (key: string, fallback: string) => string,
) {
  if (status === 'in_progress')
    return t('tasks.statusInProgress', 'In Progress');
  if (status === 'done') return t('tasks.statusDone', 'Done');
  if (status === 'cancelled') return t('tasks.statusCancelled', 'Cancelled');
  return t('tasks.statusTodo', 'Todo');
}

function getPriorityLabel(
  priority: Task['priority'],
  t: (key: string, fallback: string) => string,
) {
  if (priority === 'none') return t('tasks.priorityNone', 'None');
  if (priority === 'low') return t('tasks.priorityLow', 'Low');
  if (priority === 'high') return t('tasks.priorityHigh', 'High');
  if (priority === 'urgent') return t('tasks.priorityUrgent', 'Urgent');
  return t('tasks.priorityMedium', 'Medium');
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
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-background text-text-secondary">
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
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="transition-colors hover:bg-background/50"
            >
              <td className="px-6 py-4 font-medium text-text">{task.name}</td>
              <td className="px-6 py-4 text-text-secondary">
                {projects.find((project) => project.id === task.projectId)
                  ?.name || '-'}
              </td>
              <td className="px-6 py-4 text-text-secondary">
                {getStatusLabel(task.status, t)}
              </td>
              <td className="px-6 py-4 text-text-secondary">
                {getPriorityLabel(task.priority, t)}
              </td>
              <td className="px-6 py-4 text-text-secondary">
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
