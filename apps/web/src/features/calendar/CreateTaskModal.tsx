import React, { useState } from 'react';
import { Project } from './api';
import { formatISODate } from './utils';
import { api } from '../../lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  projects: Project[];
  userId?: string;
  onSuccess: () => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  date,
  projects,
  userId,
  onSuccess,
}: CreateTaskModalProps) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !date) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (!projectId) {
        return;
      }

      await api.post(`/projects/${projectId}/tasks`, {
        title: name,
        dueDate: formatISODate(date),
        assigneeId: userId,
      });
      onSuccess();
      onClose();
      setName('');
      setProjectId('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <p className="block text-sm font-medium text-text-secondary mb-1">
              Due Date
            </p>
            <div className="p-2 bg-sidebar border border-border rounded text-foreground text-sm">
              {date.toLocaleDateString()}
            </div>
          </div>
          <div>
            <label
              htmlFor="create-task-name"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Task Name
            </label>
            <input
              id="create-task-name"
              type="text"
              required
              className="w-full bg-sidebar border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design homepage"
            />
          </div>
          <div>
            <label
              htmlFor="create-task-project"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Project
            </label>
            <select
              id="create-task-project"
              className="w-full bg-sidebar border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-sidebar border border-border rounded hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !projectId}
              className="px-4 py-2 text-sm font-medium text-white bg-accent rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
