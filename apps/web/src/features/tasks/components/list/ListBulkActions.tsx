import React from 'react';
import { api } from '../../../../lib/api';
import { Trash2 } from 'lucide-react';

interface ListBulkActionsProps {
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  onRefresh: () => void;
}

export const ListBulkActions: React.FC<ListBulkActionsProps> = ({
  selectedIds,
  setSelectedIds,
  onRefresh,
}) => {
  if (selectedIds.size === 0) return null;

  const handleBulkStatus = async (status: string) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          api.put(`/tasks/${id}/move`, { status }),
        ),
      );
      setSelectedIds(new Set());
      onRefresh();
    } catch (err) {
      console.error('Failed bulk status update', err);
    }
  };

  const handleBulkAssignee = async (assigneeId: string) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          api.put(`/tasks/${id}`, { assigneeId }),
        ),
      );
      setSelectedIds(new Set());
      onRefresh();
    } catch (err) {
      console.error('Failed bulk assignee update', err);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} tasks?`,
      )
    )
      return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.delete(`/tasks/${id}`)),
      );
      setSelectedIds(new Set());
      onRefresh();
    } catch (err) {
      console.error('Failed bulk delete', err);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
      <span className="text-sm font-medium text-blue-400">
        {selectedIds.size} tasks selected
      </span>
      <div className="h-4 w-px bg-zinc-700" />

      <div className="flex items-center gap-2">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleBulkStatus(e.target.value);
              e.target.value = '';
            }
          }}
          className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none"
        >
          <option value="">Set Status...</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          onChange={(e) => {
            if (e.target.value) {
              handleBulkAssignee(e.target.value);
              e.target.value = '';
            }
          }}
          className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none"
        >
          <option value="">Set Assignee...</option>
          {/* Simplified assigning for now */}
          <option value="user-1">User 1</option>
        </select>

        <button
          type="button"
          onClick={handleBulkDelete}
          className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-md text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};
