import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, User, Tag, ArrowRight, Play } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { AIActionButton } from '../../../components/AIActionButton';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { ActivityFeed } from './ActivityFeed';
import { TaskDetailSubtasks } from './TaskDetailSubtasks';
import {
  type TaskDecompositionResult,
  getTaskDecompositionText,
} from './taskAi';
import {
  TASK_EDITOR_PRIORITIES,
  TASK_EDITOR_STATUSES,
} from './taskEditorOptions';

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

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [localTitle, setLocalTitle] = useState(task?.name || '');
  const [localDesc, setLocalDesc] = useState(task?.description || '');
  const [assignees, setAssignees] = useState<Assignee[]>([]);

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
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close task detail panel"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium uppercase tracking-wider text-zinc-500">
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
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Play className="h-4 w-4" />
                {t('tasks.addTimeEntry', 'Add time entry')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-8 p-6">
            <div>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => onUpdate(task.id, { name: localTitle })}
                className="w-full min-w-0 break-words whitespace-normal border-none bg-transparent px-0 text-xl font-semibold text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-0"
                placeholder={t('tasks.titlePlaceholderShort', 'Task title')}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-x-2 gap-y-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <ArrowRight className="h-4 w-4" /> {t('tasks.status', 'Status')}
              </div>
              <div className="col-span-2">
                <select
                  value={task.status}
                  onChange={(e) =>
                    onUpdate(task.id, { status: e.target.value as TaskStatus })
                  }
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                >
                  {TASK_EDITOR_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <Tag className="h-4 w-4" /> {t('tasks.priority', 'Priority')}
              </div>
              <div className="col-span-2">
                <select
                  value={task.priority}
                  onChange={(e) =>
                    onUpdate(task.id, {
                      priority: e.target.value as TaskPriority,
                    })
                  }
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                >
                  {TASK_EDITOR_PRIORITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <User className="h-4 w-4" /> {t('tasks.assignee', 'Assignee')}
              </div>
              <div className="col-span-2">
                <select
                  value={task.assigneeId ?? ''}
                  onChange={(e) =>
                    onUpdate(task.id, { assigneeId: e.target.value || null })
                  }
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">
                    {t('tasks.unassigned', 'Unassigned')}
                  </option>
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

              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-4 w-4" />{' '}
                {t('tasks.dueDate', 'Due Date')}
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
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="h-4 w-4" /> {t('tasks.estimate', 'Estimate')}
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
                  className="block w-24 rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-zinc-500">
                  {t('tasks.hours', 'hours')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-400">
                  {t('tasks.description', 'Description')}
                </div>
                <AIActionButton<TaskDecompositionResult>
                  skillId="task-decomposition"
                  label={t('tasks.aiSuggest', 'AI Suggest')}
                  context={{
                    taskName: localTitle,
                    currentDescription: localDesc,
                  }}
                  previewTitle={t(
                    'tasks.suggestedDescription',
                    'Suggested Description',
                  )}
                  onResult={(result) => {
                    const desc = getTaskDecompositionText(result);
                    setLocalDesc(desc);
                    onUpdate(task.id, { description: desc });
                  }}
                  previewRenderer={(result) => (
                    <div className="whitespace-pre-wrap text-sm">
                      {getTaskDecompositionText(result)}
                    </div>
                  )}
                />
              </div>
              <textarea
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                onBlur={() => onUpdate(task.id, { description: localDesc })}
                rows={4}
                placeholder={t(
                  'tasks.descriptionDetailedPlaceholder',
                  'Add a detailed description...',
                )}
                className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <TaskDetailSubtasks
              taskId={task.id}
              taskName={localTitle}
              description={localDesc}
            />

            <TaskComments taskId={task.id} />

            <TaskAttachments taskId={task.id} />

            <ActivityFeed entityType="TASK" entityId={task.id} />
          </div>
        </div>
      </div>
    </>
  );
};
