import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Bell } from 'lucide-react';

export function Notifications() {
  return (
    <DashboardCard
      title="Notifications"
      icon={<Bell className="w-5 h-5 text-yellow-500" />}
      isEmpty={true}
      emptyMessage="Coming soon (Notification System, Task 38)"
    >
      <div />
    </DashboardCard>
  );
}
