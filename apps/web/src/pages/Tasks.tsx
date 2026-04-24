import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Task, TaskStatus } from '@flowpilot/shared';
import { api } from '../lib/api';
import { TaskCreateModal } from '../features/tasks/components/TaskCreateModal';
import { TaskDetailPanel } from '../features/tasks/components/TaskDetailPanel';
import { TaskProjectPickerModal } from '../features/tasks/components/TaskProjectPickerModal';
import { TasksTable } from '../features/tasks/components/TasksTable';
import type { TaskProjectOption } from '../features/tasks/components/taskUi';
import {
  type ApiTaskView,
  normalizeProjectTask,
  toTaskUpdatePayload,
} from '../features/tasks/taskApi';
import { useAuthStore } from '../stores/auth';

const STATUS_OPTIONS: Array<{ value: '' | TaskStatus; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Tasks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isViewer = user?.role === 'viewer';

  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState<string | null>(null);
  const [projectSelection, setProjectSelection] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'' | TaskStatus>('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: async () => {
      const response = await api.get<{ data: ApiTaskView[] }>('/tasks/my');
      return response.data.data.map(normalizeProjectTask);
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get<{
        data: TaskProjectOption[];
        total?: number;
      }>('/projects');
      return response.data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.put(`/tasks/${id}`, toTaskUpdatePayload(data)),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
      setSelectedTask(null);
    },
  });

  const tasks = tasksData || [];
  const projects = projectsData || [];

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    return true;
  });

  function handleDelete(id: string) {
    if (
      confirm(
        t('common.confirmDelete', 'Are you sure you want to delete this task?'),
      )
    ) {
      deleteMutation.mutate(id);
    }
  }

  function handleTaskUpdate(id: string, data: Partial<Task>) {
    queryClient.setQueryData<Task[] | undefined>(['tasks', 'my'], (current) =>
      current?.map((task) => (task.id === id ? { ...task, ...data } : task)),
    );

    if (selectedTask?.id === id) {
      setSelectedTask({ ...selectedTask, ...data });
    }

    updateMutation.mutate({ id, data });
  }

  function openProjectPicker() {
    setProjectSelection('');
    setIsProjectPickerOpen(true);
  }

  function openCreateModal() {
    if (!projectSelection) return;
    setCreateProjectId(projectSelection);
    setIsProjectPickerOpen(false);
  }

  function closeCreateModal() {
    setCreateProjectId(null);
    setProjectSelection('');
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">
          {t('sidebar.tasks', 'Tasks')}
        </h1>
        {!isViewer && (
          <button
            type="button"
            onClick={openProjectPicker}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            {t('tasks.newTask', 'New Task')}
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={filterStatus}
          onChange={(event) =>
            setFilterStatus(event.target.value as '' | TaskStatus)
          }
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:border-violet-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value || 'all'} value={status.value}>
              {t(
                status.value === ''
                  ? 'common.allStatuses'
                  : `tasks.status.${status.value}`,
                status.label,
              )}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(event) => setFilterPriority(event.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:border-violet-500 focus:outline-none"
        >
          <option value="">
            {t('common.allPriorities', 'All Priorities')}
          </option>
          <option value="none">{t('tasks.priorityNone', 'None')}</option>
          <option value="low">{t('tasks.priorityLow', 'Low')}</option>
          <option value="medium">{t('tasks.priorityMedium', 'Medium')}</option>
          <option value="high">{t('tasks.priorityHigh', 'High')}</option>
          <option value="urgent">{t('tasks.priorityUrgent', 'Urgent')}</option>
        </select>
        <select
          value={filterProject}
          onChange={(event) => setFilterProject(event.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:border-violet-500 focus:outline-none"
        >
          <option value="">{t('common.allProjects', 'All Projects')}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {loadingTasks ? (
        <p className="text-text-secondary">
          {t('common.loading', 'Loading...')}
        </p>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="mb-4 text-text-secondary">
            {t('tasks.emptyState', 'No tasks found.')}
          </p>
          {!isViewer && (
            <button
              type="button"
              onClick={openProjectPicker}
              className="font-medium text-violet-500 hover:text-violet-400"
            >
              {t('tasks.createFirstTask', 'Create your first task')}
            </button>
          )}
        </div>
      ) : (
        <TasksTable
          tasks={filteredTasks}
          projects={projects}
          isViewer={isViewer}
          onEdit={setSelectedTask}
          onDelete={handleDelete}
          t={(key, fallback) => t(key, { defaultValue: fallback })}
        />
      )}

      <TaskProjectPickerModal
        isOpen={isProjectPickerOpen}
        projectSelection={projectSelection}
        projects={projects}
        onProjectSelectionChange={setProjectSelection}
        onCancel={() => setIsProjectPickerOpen(false)}
        onContinue={openCreateModal}
        t={(key, fallback) => t(key, { defaultValue: fallback })}
      />

      {createProjectId && (
        <TaskCreateModal
          isOpen
          projectId={createProjectId}
          initialStatus="todo"
          onClose={closeCreateModal}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
            closeCreateModal();
          }}
        />
      )}

      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}
