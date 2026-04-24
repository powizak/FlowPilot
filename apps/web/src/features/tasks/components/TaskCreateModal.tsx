import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { type ApiProjectTask, normalizeProjectTask } from '../taskApi';
import {
  TASK_EDITOR_PRIORITIES,
  TASK_EDITOR_STATUSES,
} from './taskEditorOptions';

interface Assignee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface TaskCreateModalProps {
  isOpen: boolean;
  projectId: string;
  initialStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  projectId,
  initialStatus,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setStatus(initialStatus);
    setPriority('none');
    setAssigneeId('');
    setDueDate('');
    setEstimatedHours('');
    setError(null);
  }, [isOpen, initialStatus]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ data: Assignee[] }>(
          `/projects/${projectId}/assignees`,
        );
        if (!cancelled) setAssignees(res.data.data);
      } catch (err) {
        console.error('Failed to load assignees', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: trimmed,
        status,
        priority,
      };
      if (description.trim()) payload.description = description.trim();
      if (assigneeId) payload.assigneeId = assigneeId;
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      if (estimatedHours) {
        const parsed = parseFloat(estimatedHours);
        if (Number.isFinite(parsed)) payload.estimatedHours = parsed;
      }
      const res = await api.post<{ data: ApiProjectTask }>(
        `/projects/${projectId}/tasks`,
        payload,
      );
      onCreated(normalizeProjectTask(res.data.data));
      onClose();
    } catch (err) {
      console.error('Failed to create task', err);
      setError('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label
              htmlFor="task-create-title"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Title
            </label>
            <input
              id="task-create-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label
              htmlFor="task-create-description"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Description
            </label>
            <textarea
              id="task-create-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-create-status"
                className="mb-1 block text-sm font-medium text-zinc-400"
              >
                Status
              </label>
              <select
                id="task-create-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              >
                {TASK_EDITOR_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="task-create-priority"
                className="mb-1 block text-sm font-medium text-zinc-400"
              >
                Priority
              </label>
              <select
                id="task-create-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              >
                {TASK_EDITOR_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="task-create-assignee"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Assignee
            </label>
            <select
              id="task-create-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email}){a.role === 'admin' ? ' • admin' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-create-due"
                className="mb-1 block text-sm font-medium text-zinc-400"
              >
                Due Date
              </label>
              <input
                id="task-create-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label
                htmlFor="task-create-estimate"
                className="mb-1 block text-sm font-medium text-zinc-400"
              >
                Estimate (h)
              </label>
              <input
                id="task-create-estimate"
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
