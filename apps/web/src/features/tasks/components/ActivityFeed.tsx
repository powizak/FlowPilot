import React, { useEffect, useState } from 'react';
import {
  Activity,
  PlusCircle,
  ArrowRightLeft,
  MessageSquare,
  Trash2,
  Pencil,
  UserPlus,
} from 'lucide-react';
import { api } from '../../../lib/api';

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface ActivityLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: ActivityUser;
}

interface ActivityFeedProps {
  entityType: string;
  entityId: string;
}

const ACTION_CONFIG: Record<
  string,
  { icon: typeof Activity; color: string; label: string }
> = {
  created: {
    icon: PlusCircle,
    color: 'text-emerald-400',
    label: 'created this task',
  },
  updated: { icon: Pencil, color: 'text-blue-400', label: 'updated this task' },
  status_changed: {
    icon: ArrowRightLeft,
    color: 'text-amber-400',
    label: 'changed status',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-violet-400',
    label: 'added a comment',
  },
  comment_deleted: {
    icon: Trash2,
    color: 'text-red-400',
    label: 'deleted a comment',
  },
  assigned: { icon: UserPlus, color: 'text-cyan-400', label: 'was assigned' },
};

const DEFAULT_CONFIG = { icon: Activity, color: 'text-zinc-400', label: '' };

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusDetail(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '';
  const from = metadata.from as string | undefined;
  const to = metadata.to as string | undefined;
  if (from && to) return `${from} → ${to}`;
  return '';
}

function getChangesDetail(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '';
  const changes = metadata.changes as string[] | undefined;
  if (changes && changes.length > 0) return changes.join(', ');
  return '';
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entityType,
  entityId,
}) => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const endpoint =
      entityType === 'TASK'
        ? `/api/tasks/${entityId}/activity`
        : `/api/projects/${entityId}/activity`;

    api
      .get(endpoint)
      .then((res) => {
        if (!cancelled) setEntries(res.data?.data ?? res.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Activity className="h-4 w-4" /> Activity
        </div>
        <div className="text-sm text-zinc-500 p-4 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Activity className="h-4 w-4" /> Activity
      </div>

      {entries.length === 0 ? (
        <div className="border border-zinc-800 rounded-md p-4 text-center text-sm text-zinc-500 bg-zinc-800/20">
          No activity yet.
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-zinc-700" />

          {entries.map((entry) => {
            const config = ACTION_CONFIG[entry.action] ?? DEFAULT_CONFIG;
            const Icon = config.icon;
            const statusDetail =
              entry.action === 'status_changed'
                ? getStatusDetail(entry.metadata)
                : '';
            const changesDetail =
              entry.action === 'updated'
                ? getChangesDetail(entry.metadata)
                : '';

            return (
              <div
                key={entry.id}
                className="relative flex items-start gap-3 pb-4 last:pb-0"
              >
                <div
                  className={`absolute -left-3.5 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 ${config.color}`}
                >
                  <Icon className="h-3 w-3" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    {entry.user.avatarUrl ? (
                      <img
                        src={entry.user.avatarUrl}
                        alt={entry.user.name}
                        className="h-5 w-5 rounded-full"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-300">
                        {entry.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-zinc-200">
                      {entry.user.name}
                    </span>
                    <span className="text-zinc-500">
                      {config.label || entry.action}
                    </span>
                    <span className="text-zinc-600 ml-auto text-xs flex-shrink-0">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>

                  {statusDetail && (
                    <div className="mt-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {statusDetail}
                      </span>
                    </div>
                  )}

                  {changesDetail && (
                    <div className="mt-1 text-xs text-zinc-500">
                      Changed: {changesDetail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
