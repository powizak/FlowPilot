import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { ListFilterBar } from '../components/list/ListFilterBar';
import { ListBulkActions } from '../components/list/ListBulkActions';
import { ListTable } from '../components/list/ListTable';

interface ListViewProps {
  projectId: string;
}

export const ListView: React.FC<ListViewProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [totalItems, setTotalItems] = useState(0);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: Task[]; meta: { total: number } }>(`/tasks`, {
        params: {
          projectId,
          search: search || undefined,
          status: status || undefined,
          assigneeId: assignee || undefined,
          priority: priority || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        },
      });
      setTasks(res.data.data);
      if (res.data.meta) {
        setTotalItems(res.data.meta.total);
      } else {
        setTotalItems(res.data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, search, status, assignee, priority, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await api.put<{ data: Task }>(`/tasks/${id}`, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...res.data.data } : t)));
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleMove = async (id: string, newStatus: TaskStatus) => {
    try {
      const res = await api.put<{ data: Task }>(`/tasks/${id}/move`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...res.data.data } : t)));
    } catch (err) {
      console.error('Failed to move task', err);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex flex-col gap-4 mb-4">
        <ListFilterBar
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          assignee={assignee}
          setAssignee={setAssignee}
          priority={priority}
          setPriority={setPriority}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="none">None</option>
            <option value="status">Status</option>
            <option value="assigneeId">Assignee</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      <ListBulkActions
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onRefresh={fetchTasks}
      />

      <div className="flex-1 overflow-auto border border-zinc-800/50 rounded-lg bg-zinc-900/50">
        <ListTable
          tasks={tasks}
          isLoading={isLoading}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          groupBy={groupBy}
          onUpdate={handleUpdate}
          onMove={handleMove}
          onReorder={async (taskIds) => {
            try {
              await api.put('/tasks/reorder', { taskIds });
              fetchTasks();
            } catch (err) {
              console.error('Failed to reorder tasks', err);
            }
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(id, desc) => {
            setSortBy(id);
            setSortOrder(desc ? 'desc' : 'asc');
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-zinc-500">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} tasks
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= totalItems}
            className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
