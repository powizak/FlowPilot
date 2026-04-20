import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '📋',
  task_due_soon: '⏰',
  task_overdue: '🔴',
  invoice_paid: '💰',
  budget_warning: '⚠️',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEntityRoute(entityType?: string, entityId?: string): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case 'task': return `/tasks/${entityId}`;
    case 'invoice': return `/invoices/${entityId}`;
    case 'project': return `/projects/${entityId}`;
    default: return null;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?isRead=false');
      const data: Notification[] = res.data;
      setNotifications(data);
      setUnreadCount(data.length);
    } catch { }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!accessToken) return;

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
    const es = new EventSource(
      `${apiUrl}/api/notifications/stream?token=${accessToken}`,
    );

    es.addEventListener('notification', () => {
      fetchNotifications();
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [accessToken, fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    const route = getEntityRoute(n.entityType, n.entityId);
    if (route) {
      window.location.href = route;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-text-secondary hover:bg-surface hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-secondary">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border last:border-0',
                    !n.isRead && 'bg-primary/5',
                  )}
                >
                  <span className="mt-0.5 text-base">
                    {TYPE_ICONS[n.type] ?? '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                      {n.body}
                    </p>
                    <span className="mt-1 text-[10px] text-text-secondary">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
