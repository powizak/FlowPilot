import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  action?: React.ReactNode;
}

export function DashboardCard({
  title,
  icon,
  children,
  isLoading,
  isEmpty,
  emptyMessage = 'No data available',
  className,
  action
}: DashboardCardProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-xl flex flex-col h-full overflow-hidden", className)}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-text-secondary">{icon}</span>}
          <h3 className="font-semibold text-text">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5 flex-1 flex flex-col min-h-[150px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
