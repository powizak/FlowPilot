import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { KanbanColumn } from '../components/KanbanColumn';
import { KanbanCard } from '../components/KanbanCard';
import { TaskFilters, FilterType } from '../components/TaskFilters';
import { NewTaskInline } from '../components/NewTaskInline';
import { TaskDetailPanel } from '../components/TaskDetailPanel';

interface KanbanViewProps {
  projectId: string;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
  { id: 'cancelled', title: 'Cancelled' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingTaskStatus, setAddingTaskStatus] = useState<TaskStatus | null>(
    null,
  );

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: Task[] }>(`/tasks`, {
        params: { projectId },
      });
      setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today);
    week.setDate(week.getDate() + 7);

    switch (filter) {
      case 'my-tasks':
        // we'd need userId from auth store, for now assuming filter is local only
        break;
      case 'due-today':
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        });
        break;
      case 'due-week':
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d >= today && d <= week;
        });
        break;
      case 'overdue':
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          d.setHours(0, 0, 0, 0);
          return d < today && t.status !== 'done' && t.status !== 'cancelled';
        });
        break;
      default:
        break;
    }
    return result;
  }, [tasks, filter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setTasks((tasks) => {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const activeTask = tasks[activeIndex];

      if (isOverTask) {
        const overIndex = tasks.findIndex((t) => t.id === overId);
        const overTask = tasks[overIndex];

        if (activeTask.status !== overTask.status) {
          activeTask.status = overTask.status;
          return arrayMove(tasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      }

      if (isOverColumn) {
        const overStatus = over.data.current?.status as TaskStatus;
        if (activeTask.status !== overStatus) {
          activeTask.status = overStatus;
          return arrayMove(tasks, activeIndex, activeIndex);
        }
      }

      return tasks;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const originalStatus = activeTask.status;
    let newStatus = originalStatus;

    if (over.data.current?.type === 'Column') {
      newStatus = over.data.current?.status as TaskStatus;
    } else if (over.data.current?.type === 'Task') {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (originalStatus === newStatus && activeId === overId) return;

    try {
      await api.put(`/tasks/${activeId}/move`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status', err);
      // Revert optimistic update
      fetchTasks();
    }
  };

  const handleAddTask = async (title: string, status: TaskStatus) => {
    try {
      setAddingTaskStatus(null);
      const res = await api.post<{ data: Task }>(`/tasks`, {
        projectId,
        name: title,
        status,
        priority: 'none',
      });
      setTasks([...tasks, res.data.data]);
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    if (selectedTask?.id === id) {
      setSelectedTask({ ...selectedTask, ...updates } as Task);
    }

    try {
      await api.put(`/tasks/${id}`, updates);
    } catch (err) {
      console.error('Failed to update task', err);
      fetchTasks();
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">Board View</h1>
        <TaskFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {isLoading ? (
          <div className="flex gap-6">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="w-80 flex-shrink-0 animate-pulse bg-zinc-900/50 rounded-xl p-4 h-96"
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter(
                (t) => t.status === col.id,
              );
              return (
                <div
                  key={col.id}
                  className="flex flex-col gap-3 min-w-[280px] md:min-w-[320px]"
                >
                  <KanbanColumn
                    id={col.id}
                    title={col.title}
                    tasks={columnTasks}
                    onTaskClick={setSelectedTask}
                    onAddTask={setAddingTaskStatus}
                  />
                  {addingTaskStatus === col.id && (
                    <div className="px-2">
                      <NewTaskInline
                        status={col.id}
                        onSubmit={handleAddTask}
                        onCancel={() => setAddingTaskStatus(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-80 scale-105 rotate-2 transition-transform">
                  <KanbanCard task={activeTask} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
};
