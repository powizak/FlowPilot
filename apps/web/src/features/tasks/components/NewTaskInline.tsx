import React, { useState } from 'react';
import { TaskStatus } from '@flowpilot/shared';

interface NewTaskInlineProps {
  status: TaskStatus;
  onSubmit: (title: string, status: TaskStatus) => void;
  onCancel: () => void;
}

export const NewTaskInline: React.FC<NewTaskInlineProps> = ({ status, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      onSubmit(title.trim(), status);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        className="w-full bg-transparent text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          onClick={() => title.trim() && onSubmit(title.trim(), status)}
          disabled={!title.trim()}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};
