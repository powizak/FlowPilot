import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, User, Tag, ArrowRight, Play } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { AIActionButton } from '../../../components/AIActionButton';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { ActivityFeed } from './ActivityFeed';

interface Assignee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface TaskSuggestion {
  id?: string;
  name: string;
  description?: string;
}

interface TaskDecompositionResult {
  description?: string;
  tasks?: TaskSuggestion[];
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const navigate = useNavigate();
  const [localTitle, setLocalTitle] = useState(task?.name || '');
  const [localDesc, setLocalDesc] = useState(task?.description || '');
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const getResultText = (result: TaskDecompositionResult | string): string => {
    if (typeof result === 'string') return result;
    if (typeof result?.description === 'string') return result.description;
    if (typeof result?.tasks?.[0]?.description === 'string') {
      return result.tasks[0].description;
    }
    return JSON.stringify(result);
  };

  useEffect(() => {
    if (task) {
      setLocalTitle(task.name);
      setLocalDesc(task.description || '');
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ data: Assignee[] }>(
          `/projects/${task.projectId}/assignees`,
        );
        if (!cancelled) setAssignees(res.data.data);
      } catch (err) {
        console.error('Failed to load assignees', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-label="Close task detail panel"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                {task.id.split('-')[0].substring(0, 4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/time?projectId=${task.projectId}&taskId=${task.id}`,
                  )
                }
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-800"
              >
                <Play className="h-4 w-4" />
                Add time entry
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 space-y-8">
            {/* Title */}
            <div>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => onUpdate(task.id, { name: localTitle })}
                className="w-full min-w-0 break-words whitespace-normal text-xl font-semibold bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 focus:ring-0 px-0"
                placeholder="Task title"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-sm items-center">
              <div className="text-zinc-400 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Status
              </div>
              <div className="col-span-2">
                <select
                  value={task.status}
                  onChange={(e) =>
                    onUpdate(task.id, { status: e.target.value as TaskStatus })
                  }
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-zinc-400 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Priority
              </div>
              <div className="col-span-2">
                <select
                  value={task.priority}
                  onChange={(e) =>
                    onUpdate(task.id, {
                      priority: e.target.value as TaskPriority,
                    })
                  }
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                >
                  {PRIORITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-zinc-400 flex items-center gap-2">
                <User className="h-4 w-4" /> Assignee
              </div>
              <div className="col-span-2">
                <select
                  value={task.assigneeId ?? ''}
                  onChange={(e) =>
                    onUpdate(task.id, { assigneeId: e.target.value || null })
                  }
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email}){a.role === 'admin' ? ' • admin' : ''}
                    </option>
                  ))}
                  {task.assigneeId &&
                    !assignees.some((a) => a.id === task.assigneeId) && (
                      <option value={task.assigneeId}>{task.assigneeId}</option>
                    )}
                </select>
              </div>

              <div className="text-zinc-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Due Date
              </div>
              <div className="col-span-2">
                <input
                  type="date"
                  value={
                    task.dueDate
                      ? new Date(task.dueDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    onUpdate(task.id, {
                      dueDate: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                />
              </div>

              <div className="text-zinc-400 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Estimate
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.estimatedHours || ''}
                  onChange={(e) =>
                    onUpdate(task.id, {
                      estimatedHours: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-24 p-2"
                />
                <span className="text-zinc-500">hours</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-400">
                  Description
                </div>
                <AIActionButton<TaskDecompositionResult>
                  skillId="task-decomposition"
                  label="AI Suggest"
                  context={{
                    taskName: localTitle,
                    currentDescription: localDesc,
                  }}
                  previewTitle="Suggested Description"
                  onResult={(result) => {
                    const desc = getResultText(result);
                    setLocalDesc(desc);
                    onUpdate(task.id, { description: desc });
                  }}
                  previewRenderer={(result) => (
                    <div className="text-sm whitespace-pre-wrap">
                      {getResultText(result)}
                    </div>
                  )}
                />
              </div>
              <textarea
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                onBlur={() => onUpdate(task.id, { description: localDesc })}
                rows={4}
                placeholder="Add a detailed description..."
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-3 resize-y"
              />
            </div>

            {/* Subtasks (placeholder for visual completeness) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-400">
                  Subtasks
                </div>
                <AIActionButton<TaskDecompositionResult>
                  skillId="task-decomposition"
                  label="AI Decompose"
                  context={{ taskName: localTitle, description: localDesc }}
                  previewTitle="Suggested Subtasks"
                  onResult={(result) => {
                    console.log('Would create subtasks:', result);
                  }}
                  previewRenderer={(result) => (
                    <ul className="list-disc pl-4 space-y-2">
                      {(result.tasks || []).map((task) => (
                        <li key={task.id ?? task.name} className="text-sm">
                          <strong>{task.name}</strong>
                          {task.description && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {task.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </div>
              <div className="border border-zinc-800 rounded-md p-4 text-center text-sm text-zinc-500 bg-zinc-800/20">
                No subtasks yet.
              </div>
            </div>

            <TaskComments taskId={task.id} />

            <TaskAttachments taskId={task.id} />

            <ActivityFeed entityType="TASK" entityId={task.id} />
          </div>
        </div>
      </div>
    </>
  );
};
