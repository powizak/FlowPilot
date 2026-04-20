import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  GroupingState,
  Row,
  Cell
} from '@tanstack/react-table';
import { Task, TaskStatus } from '@flowpilot/shared';
import { getColumns } from './ListColumns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface SortableRowProps {
  row: Row<Task>;
  selectedIds: Set<string>;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ row, selectedIds, onUpdate }) => {
  const { attributes, listeners, transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${
        isDragging ? 'bg-zinc-800 shadow-xl' : ''
      }`}
    >
      <td className="w-8 text-center px-2 py-3 text-zinc-600 hover:text-zinc-400 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </td>
      {row.getVisibleCells().map((cell: Cell<Task, unknown>) => (
        <td key={cell.id} className="px-3 py-3 text-sm text-zinc-300">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

interface ListTableProps {
  tasks: Task[];
  isLoading: boolean;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  groupBy: string;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onReorder: (taskIds: string[]) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (id: string, desc: boolean) => void;
}

export const ListTable: React.FC<ListTableProps> = ({
  tasks,
  isLoading,
  selectedIds,
  setSelectedIds,
  groupBy,
  onUpdate,
  onReorder,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const columns = useMemo(() => getColumns(selectedIds, setSelectedIds, onUpdate), [selectedIds, setSelectedIds, onUpdate]);

  const grouping = useMemo<GroupingState>(() => (groupBy !== 'none' ? [groupBy] : []), [groupBy]);

  const table = useReactTable({
    data: tasks,
    columns,
    state: { grouping },
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableGrouping: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(newTasks.map(t => t.id));
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center text-zinc-500">Loading tasks...</div>;
  }

  const items = tasks.map((t) => t.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-900 sticky top-0 z-10 shadow-sm border-b border-zinc-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <th className="w-8"></th>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  onClick={() => {
                    const isDesc = sortBy === header.id && sortOrder === 'asc';
                    onSortChange(header.id, isDesc);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sortBy === header.id && (
                      <span className="text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <tr key={row.id} className="bg-zinc-900/80 border-b border-zinc-800">
                    <td colSpan={columns.length + 1} className="px-3 py-2 text-sm font-medium text-zinc-300">
                      <button
                        className="flex items-center gap-2 hover:text-zinc-100"
                        onClick={row.getToggleExpandedHandler()}
                      >
                        {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {String(row.getValue(row.groupingColumnId as string))}
                        <span className="text-zinc-500 text-xs ml-2">({row.subRows.length})</span>
                      </button>
                    </td>
                  </tr>
                );
              }
              return <SortableRow key={row.id} row={row} selectedIds={selectedIds} onUpdate={onUpdate} />;
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-zinc-500">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </SortableContext>
      </table>
    </DndContext>
  );
};
