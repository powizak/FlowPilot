import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Sparkles, Menu } from 'lucide-react';
import { TimerWidget } from './TimerWidget';
import { NotificationBell } from './NotificationBell';
import { api } from '../lib/api';

interface TopbarProps {
  onToggleAiChat?: () => void;
  isAiChatOpen?: boolean;
  onMenuClick?: () => void;
}

export default function Topbar({
  onToggleAiChat,
  isAiChatOpen,
  onMenuClick,
}: TopbarProps) {
  const { pathname } = useLocation();
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>(
    {},
  );

  const pathParts = pathname.split('/').filter(Boolean);

  const projectId = useMemo(() => {
    if (pathParts[0] !== 'projects') {
      return null;
    }

    return pathParts[1] ?? null;
  }, [pathParts]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;

    api
      .get<{ data: { name: string } }>(`/projects/${projectId}`)
      .then((response) => {
        if (!cancelled) {
          setResolvedLabels((current) => ({
            ...current,
            [projectId]: response.data.data.name,
          }));
        }
      })
      .catch((error) => {
        console.error('Failed to resolve topbar label', error);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center text-sm font-medium text-text-secondary">
        {onMenuClick && (
          <button
            type="button"
            className="md:hidden mr-3 flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-hover hover:text-foreground"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="capitalize hidden sm:inline">FlowPilot</span>
        {pathParts.length > 0 && (
          <ChevronRight className="mx-1 h-4 w-4 hidden sm:block" />
        )}
        {pathParts.map((part, index) => {
          const key = `${index}-${part}`;
          const label =
            index === 1 && pathParts[0] === 'projects'
              ? (resolvedLabels[part] ?? part)
              : part;

          return (
            <div key={key} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
              <span
                className={
                  index === pathParts.length - 1
                    ? 'text-foreground capitalize'
                    : 'capitalize hidden sm:inline'
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <TimerWidget />
        <NotificationBell />
        <button
          type="button"
          onClick={onToggleAiChat}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isAiChatOpen
              ? 'bg-blue-600/20 text-blue-500'
              : 'bg-surface text-text-secondary hover:bg-muted hover:text-foreground'
          }`}
          aria-label="Toggle AI Chat"
        >
          <Sparkles size={18} />
        </button>
      </div>
    </header>
  );
}
