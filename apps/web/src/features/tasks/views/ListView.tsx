import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../../lib/api';
import { FilterBuilder } from '../../filters/FilterBuilder';
import { SavedViewsDropdown } from '../../filters/SavedViewsDropdown';
import type { FilterCondition } from '../../filters/filter-builder.shared';
import { ListFilterBar } from '../components/list/ListFilterBar';
import { ListBulkActions } from '../components/list/ListBulkActions';
import { ListTable } from '../components/list/ListTable';

interface ListViewProps {
  projectId: string;
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

type Task = {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string | null;
  reporterId: string | null;
  estimatedHours: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  trackTime: boolean;
  billingType: 'hourly' | 'non_billable' | null;
  workTypeId: string | null;
  position: number;
  labels: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  doneAt: Date | null;
};

const matchesCondition = (task: Task, condition: FilterCondition) => {
  if (condition.value === '' && condition.field !== 'assigneeId') return true;

  if (condition.field === 'status' || condition.field === 'priority') {
    const value = task[condition.field];
    return condition.operator === 'is'
      ? value === condition.value
      : value !== condition.value;
  }

  if (condition.field === 'assigneeId') {
    const assigneeId = task.assigneeId ?? '';
    if (condition.value === '') {
      return condition.operator === 'is'
        ? assigneeId === ''
        : assigneeId !== '';
    }
    return condition.operator === 'is'
      ? assigneeId === condition.value
      : assigneeId !== condition.value;
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
  const compareDate = new Date(`${condition.value}T00:00:00`);
  if (Number.isNaN(compareDate.getTime())) return true;
  return condition.operator === 'before'
    ? dueDate < compareDate
    : dueDate > compareDate;
};

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
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: Task[] }>(
        `/projects/${projectId}/tasks`,
        {
          params: {
            search: search || undefined,
            status: status || undefined,
            assigneeId: assignee || undefined,
            priority: priority || undefined,
            page: 1,
            limit: 1000,
            sortBy,
            sortOrder,
          },
        },
      );
      setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, search, status, assignee, priority, sortBy, sortOrder]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        conditions.every((condition) => matchesCondition(task, condition)),
      ),
    [conditions, tasks],
  );

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredTasks.slice(start, start + limit);
  }, [filteredTasks, limit, page]);

  const totalItems = filteredTasks.length;

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await api.put<{ data: Task }>(`/tasks/${id}`, updates);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...res.data.data } : t)),
      );
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleMove = async (id: string, newStatus: TaskStatus) => {
    try {
      const res = await api.put<{ data: Task }>(`/tasks/${id}/move`, {
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...res.data.data } : t)),
      );
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
        <FilterBuilder conditions={conditions} onChange={setConditions} />
        <div className="flex flex-wrap items-center gap-3">
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
          <SavedViewsDropdown
            conditions={conditions}
            onChange={setConditions}
          />
        </div>
      </div>

      <ListBulkActions
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onRefresh={fetchTasks}
      />

      <div className="flex-1 overflow-auto border border-zinc-800/50 rounded-lg bg-zinc-900/50">
        <ListTable
          tasks={paginatedTasks}
          isLoading={isLoading}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          groupBy={groupBy}
          onUpdate={handleUpdate}
          onMove={handleMove}
          onReorder={async (taskIds) => {
            try {
              await api.put('/tasks/reorder', {
                items: taskIds.map((id, index) => ({ id, position: index })),
              });
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
          {totalItems === 0
            ? 'Showing 0 to 0 of 0 tasks'
            : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalItems)} of ${totalItems} tasks`}
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
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
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
