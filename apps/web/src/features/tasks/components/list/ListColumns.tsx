import { ColumnDef } from '@tanstack/react-table';
import { Task, TaskPriority, TaskStatus } from '@flowpilot/shared';
import React, { useState } from 'react';

interface TypedSelectOption<T extends string> {
  label: string;
  value: T;
}

function TextEditableCell({
  value,
  onSave,
}: {
  value: string | null | undefined;
  onSave: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const initialValue = value ?? '';
  const [editValue, setEditValue] = useState(initialValue);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue === initialValue) {
      return;
    }
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(initialValue);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full h-full min-h-[24px] cursor-text flex items-center px-2 hover:bg-zinc-800/50 rounded transition-colors"
      >
        {value || '-'}
      </button>
    );
  }

  return (
    <input
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  );
}

function SelectEditableCell<T extends string>({
  value,
  onSave,
  options,
}: {
  value: T;
  onSave: (value: T) => void;
  options: TypedSelectOption<T>[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<T>(value);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue === value) {
      return;
    }
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    const selectedOption = options.find((option) => option.value === value);

    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full h-full min-h-[24px] cursor-text flex items-center px-2 hover:bg-zinc-800/50 rounded transition-colors"
      >
        {selectedOption?.label ?? value}
      </button>
    );
  }

  return (
    <select
      value={editValue}
      onChange={(e) => setEditValue(e.target.value as T)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NumberEditableCell({
  value,
  onSave,
}: {
  value: number | null | undefined;
  onSave: (value: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const initialValue = value?.toString() ?? '';
  const [editValue, setEditValue] = useState(initialValue);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue === initialValue) {
      return;
    }

    const nextValue = editValue.trim();
    onSave(nextValue === '' ? null : Number(nextValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(initialValue);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full h-full min-h-[24px] cursor-text flex items-center px-2 hover:bg-zinc-800/50 rounded transition-colors"
      >
        {value ?? '-'}
      </button>
    );
  }

  return (
    <input
      type="number"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  );
}

function DateEditableCell({
  value,
  onSave,
}: {
  value: Date | null | undefined;
  onSave: (value: Date | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const initialValue = value ? new Date(value).toISOString().split('T')[0] : '';
  const [editValue, setEditValue] = useState(initialValue);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue === initialValue) {
      return;
    }

    const nextValue = editValue.trim();
    onSave(nextValue === '' ? null : new Date(nextValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(initialValue);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full h-full min-h-[24px] cursor-text flex items-center px-2 hover:bg-zinc-800/50 rounded transition-colors"
      >
        {value ? new Date(value).toLocaleDateString() : '-'}
      </button>
    );
  }

  return (
    <input
      type="date"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  );
}

export const getColumns = (
  selectedIds: Set<string>,
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  onUpdate: (id: string, updates: Partial<Task>) => void,
): ColumnDef<Task>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50"
        checked={selectedIds.has(row.original.id)}
        onChange={(e) => {
          const newSet = new Set(selectedIds);
          if (e.target.checked) newSet.add(row.original.id);
          else newSet.delete(row.original.id);
          setSelectedIds(newSet);
        }}
      />
    ),
  },
  {
    id: 'title',
    accessorFn: (task) => task.name,
    header: 'Task Name',
    cell: ({ row, getValue }) => (
      <TextEditableCell
        value={getValue() as string | null | undefined}
        onSave={(name) => onUpdate(row.original.id, { name })}
      />
    ),
  },
  {
    accessorKey: 'assigneeId',
    header: 'Assignee',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row, getValue }) => {
      const val = getValue() as string;
      return (
        <TextEditableCell
          value={val as string | null | undefined}
          onSave={(assigneeId) => onUpdate(row.original.id, { assigneeId })}
        />
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, getValue }) => {
      const val = getValue() as string;
      return (
        <SelectEditableCell<TaskStatus>
          value={val as TaskStatus}
          options={[
            { label: 'To Do', value: 'todo' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Done', value: 'done' },
            { label: 'Cancelled', value: 'cancelled' },
          ]}
          onSave={(status) => onUpdate(row.original.id, { status })}
        />
      );
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row, getValue }) => {
      const val = getValue() as string;
      return (
        <SelectEditableCell<TaskPriority>
          value={val as TaskPriority}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ]}
          onSave={(priority) => onUpdate(row.original.id, { priority })}
        />
      );
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row, getValue }) => (
      <DateEditableCell
        value={getValue() as Date | null | undefined}
        onSave={(dueDate) => onUpdate(row.original.id, { dueDate })}
      />
    ),
  },
  {
    accessorKey: 'estimatedHours',
    header: 'Est. Hours',
    cell: ({ row, getValue }) => (
      <NumberEditableCell
        value={getValue() as number | null | undefined}
        onSave={(estimatedHours) =>
          onUpdate(row.original.id, { estimatedHours })
        }
      />
    ),
  },
  {
    id: 'actualHours',
    header: 'Act. Hours',
    cell: () => <div className="px-2 text-zinc-500">-</div>,
  },
];
