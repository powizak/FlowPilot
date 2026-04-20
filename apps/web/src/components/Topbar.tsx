import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/auth';

export default function Topbar() {
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
            <span className={index === pathParts.length - 1 ? 'text-foreground capitalize' : 'capitalize'}>
              {part}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary cursor-pointer hover:bg-hover">
          <span className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          00:00:00
        </div>
      </div>
    </header>
  );
}
