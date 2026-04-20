import { ColumnDef } from '@tanstack/react-table';
import { Task } from '@flowpilot/shared';
import React, { useState } from 'react';
import { api } from '../../../../lib/api';

// Shared component for inline editing
const EditableCell = ({
  value,
  onSave,
  type = 'text',
  options = []
}: {
  value: any;
  onSave: (val: any) => void;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: string }[];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <div 
        onDoubleClick={() => setIsEditing(true)} 
        className="w-full h-full min-h-[24px] cursor-text flex items-center px-2 hover:bg-zinc-800/50 rounded transition-colors"
      >
        {type === 'date' && value ? new Date(value).toLocaleDateString() : value || '-'}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <select
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      value={type === 'date' && editValue ? new Date(editValue).toISOString().split('T')[0] : editValue || ''}
      onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      autoFocus
      className="w-full px-2 py-1 bg-zinc-900 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  );
};

export const getColumns = (
  selectedIds: Set<string>,
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  onUpdate: (id: string, updates: Partial<Task>) => void
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
    accessorKey: 'name',
    header: 'Task Name',
    cell: ({ row, getValue }) => (
      <EditableCell 
        value={getValue()} 
        onSave={(name) => onUpdate(row.original.id, { name })} 
      />
    ),
  },
  {
    accessorKey: 'assigneeId',
    header: 'Assignee',
    cell: ({ row, getValue }) => {
      const val = getValue() as string;
      return (
        <EditableCell 
          value={val} 
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
        <EditableCell 
          type="select"
          value={val} 
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
        <EditableCell 
          type="select"
          value={val} 
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
    cell: ({ row, getValue }) => (
      <EditableCell 
        type="date"
        value={getValue()} 
        onSave={(dueDate) => onUpdate(row.original.id, { dueDate })} 
      />
    ),
  },
  {
    accessorKey: 'estimatedHours',
    header: 'Est. Hours',
    cell: ({ row, getValue }) => (
      <EditableCell 
        type="number"
        value={getValue()} 
        onSave={(estimatedHours) => onUpdate(row.original.id, { estimatedHours })} 
      />
    ),
  },
  {
    id: 'actualHours',
    header: 'Act. Hours',
    cell: () => (
      <div className="px-2 text-zinc-500">-</div>
    ),
  }
];
