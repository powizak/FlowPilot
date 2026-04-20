import React from 'react';
import { Search } from 'lucide-react';

interface ListFilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  status: string;
  setStatus: (s: string) => void;
  assignee: string;
  setAssignee: (a: string) => void;
  priority: string;
  setPriority: (p: string) => void;
}

export const ListFilterBar: React.FC<ListFilterBarProps> = ({
  search,
  setSearch,
  status,
  setStatus,
  assignee,
  setAssignee,
  priority,
  setPriority,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-zinc-800/50 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="">All Statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="">All Priorities</option>
        <option value="none">None</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <input
        type="text"
        placeholder="Assignee ID"
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    </div>
  );
};
