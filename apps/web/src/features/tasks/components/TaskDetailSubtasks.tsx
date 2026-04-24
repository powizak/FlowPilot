import { useEffect, useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import type { Task } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { AIActionButton } from '../../../components/AIActionButton';
import { type ApiTaskView, normalizeProjectTask } from '../taskApi';
import {
  type TaskDecompositionResult,
  getTaskDecompositionText,
} from './taskAi';

interface TaskDetailSubtasksProps {
  taskId: string;
  taskName: string;
  description: string;
}

function getStatusLabel(status: Task['status']): string {
  if (status === 'in_progress') return 'In Progress';
  if (status === 'done') return 'Done';
  if (status === 'cancelled') return 'Cancelled';
  return 'Todo';
}

export function TaskDetailSubtasks({
  taskId,
  taskName,
  description,
}: TaskDetailSubtasksProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSubtasks() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<{ data: ApiTaskView[] }>(
          `/tasks/${taskId}/subtasks`,
        );
        if (!cancelled) {
          setSubtasks(response.data.data.map(normalizeProjectTask));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load subtasks', err);
          setError('Failed to load subtasks');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setNewTitle('');
    loadSubtasks();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function createSubtasks(
    items: Array<{ title: string; description?: string }>,
  ) {
    const validItems = items
      .map((item) => ({
        title: item.title.trim(),
        description: item.description?.trim(),
      }))
      .filter((item) => item.title.length > 0);

    if (validItems.length === 0) {
      setError('Subtask title is required');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const created: Task[] = [];
      for (const item of validItems) {
        const response = await api.post<{ data: ApiTaskView }>(
          `/tasks/${taskId}/subtasks`,
          {
            title: item.title,
            description: item.description || undefined,
          },
        );
        created.push(normalizeProjectTask(response.data.data));
      }

      setSubtasks((current) => [...current, ...created]);
      setNewTitle('');
      return true;
    } catch (err) {
      console.error('Failed to create subtasks', err);
      setError('Failed to create subtasks');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit() {
    await createSubtasks([{ title: newTitle }]);
  }

  async function handleAiResult(result: TaskDecompositionResult) {
    const suggestions = (result.tasks || []).map((task) => ({
      title: task.name,
      description: task.description || getTaskDecompositionText(result),
    }));
    await createSubtasks(suggestions);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-400">Subtasks</div>
        <AIActionButton<TaskDecompositionResult>
          skillId="task-decomposition"
          label="AI Decompose"
          context={{ taskName, description }}
          previewTitle="Suggested Subtasks"
          onResult={handleAiResult}
          previewRenderer={(result) => (
            <ul className="list-disc pl-4 space-y-2">
              {(result.tasks || []).map((task) => (
                <li key={task.id ?? task.name} className="text-sm">
                  <strong>{task.name}</strong>
                  {task.description && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {task.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a subtask"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSaving || newTitle.trim().length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </button>
      </form>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-800/20 p-3">
        {isLoading ? (
          <div className="text-sm text-zinc-500">Loading subtasks...</div>
        ) : subtasks.length === 0 ? (
          <div className="text-sm text-zinc-500">No subtasks yet.</div>
        ) : (
          subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-sm font-medium text-zinc-100">
                    {subtask.name}
                  </div>
                  {subtask.description && (
                    <div className="line-clamp-2 text-xs text-zinc-500">
                      {subtask.description}
                    </div>
                  )}
                </div>
                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                  {getStatusLabel(subtask.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
