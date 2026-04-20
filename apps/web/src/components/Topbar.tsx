import { useLocation } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { TimerWidget } from './TimerWidget';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  onToggleAiChat?: () => void;
  isAiChatOpen?: boolean;
}

export default function Topbar({ onToggleAiChat, isAiChatOpen }: TopbarProps) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const pathParts = pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center text-sm font-medium text-text-secondary">
        <span className="capitalize">FlowPilot</span>
        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="mx-1 h-4 w-4" />
            <span
              className={
                index === pathParts.length - 1
                  ? 'text-foreground capitalize'
                  : 'capitalize'
              }
            >
              {part}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <TimerWidget />
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
