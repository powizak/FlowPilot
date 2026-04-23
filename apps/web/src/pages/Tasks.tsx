import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { TaskForm, TaskFormData } from '../features/tasks/components/TaskForm';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string;
  project?: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
}

export default function Tasks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isViewer = user?.role === 'viewer';

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: async () => {
      const response = await api.get<{ data: Task[] }>('/tasks/my');
      return response.data.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get<{ data: { data: Project[] } }>(
        '/projects',
      );
      const payload = response.data.data;
      return Array.isArray(payload)
        ? payload
        : (payload as { items?: Project[] }).items || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return api.post(`/projects/${data.projectId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TaskFormData>;
    }) => {
      return api.put(`/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
    },
  });

  const handleDelete = (id: string) => {
    if (
      confirm(
        t('common.confirmDelete', 'Are you sure you want to delete this task?'),
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const tasks = tasksData || [];
  const projects = projectsData || [];

  const filteredTasks = tasks.filter((t: Task) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject && t.projectId !== filterProject) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-text">
          {t('sidebar.tasks', 'Tasks')}
        </h1>
        {!isViewer && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {t('tasks.newTask', 'New Task')}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-violet-500"
        >
          <option value="">{t('common.allStatuses', 'All Statuses')}</option>
          <option value="backlog">{t('tasks.statusBacklog', 'Backlog')}</option>
          <option value="todo">{t('tasks.statusTodo', 'Todo')}</option>
          <option value="in_progress">
            {t('tasks.statusInProgress', 'In Progress')}
          </option>
          <option value="review">{t('tasks.statusReview', 'Review')}</option>
          <option value="done">{t('tasks.statusDone', 'Done')}</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-violet-500"
        >
          <option value="">
            {t('common.allPriorities', 'All Priorities')}
          </option>
          <option value="low">{t('tasks.priorityLow', 'Low')}</option>
          <option value="medium">{t('tasks.priorityMedium', 'Medium')}</option>
          <option value="high">{t('tasks.priorityHigh', 'High')}</option>
          <option value="urgent">{t('tasks.priorityUrgent', 'Urgent')}</option>
        </select>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-violet-500"
        >
          <option value="">{t('common.allProjects', 'All Projects')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loadingTasks ? (
        <p className="text-text-secondary">
          {t('common.loading', 'Loading...')}
        </p>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <p className="text-text-secondary mb-4">
            {t('tasks.emptyState', 'No tasks found.')}
          </p>
          {!isViewer && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-violet-500 hover:text-violet-400 font-medium"
            >
              {t('tasks.createFirstTask', 'Create your first task')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-border text-text-secondary">
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
                  <th className="px-6 py-3 font-medium text-right">
                    {t('common.actions', 'Actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.map((task: Task) => (
                <tr
                  key={task.id}
                  className="hover:bg-background/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-text">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {task.project?.name ||
                      projects.find((p) => p.id === task.projectId)?.name ||
                      '-'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {t(
                      `tasks.status${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', '')}`,
                      task.status,
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {t(
                      `tasks.priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`,
                      task.priority,
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  {!isViewer && (
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        className="text-violet-500 hover:text-violet-400 font-medium"
                      >
                        {t('common.edit', 'Edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="text-red-500 hover:text-red-400 font-medium"
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
      )}

      {(showForm || editingTask) && (
        <TaskForm
          initialData={editingTask || undefined}
          projects={projects}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
