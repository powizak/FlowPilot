import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Activity } from 'lucide-react';

export function RecentActivity() {
  return (
    <DashboardCard
      title="Recent Activity"
      icon={<Activity className="w-5 h-5 text-indigo-500" />}
      isEmpty={true}
      emptyMessage="Coming soon (Activity Log, Task 52)"
    >
      <div />
    </DashboardCard>
  );
}
