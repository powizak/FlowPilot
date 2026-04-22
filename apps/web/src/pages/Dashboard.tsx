import React from 'react';
import {
  MyTasksToday,
  RunningTimer,
  OverdueTasks,
  WeeklyHours,
  ProjectBudget,
  UpcomingDeadlines,
  RecentActivity,
  Notifications,
} from '../features/dashboard';

export default function Dashboard() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto text-foreground">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Overview of your activity and pending work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <RunningTimer />
        <MyTasksToday />
        <OverdueTasks />

        <WeeklyHours />
        <ProjectBudget />
        <UpcomingDeadlines />

        <RecentActivity />
        <Notifications />
      </div>
    </div>
  );
}
