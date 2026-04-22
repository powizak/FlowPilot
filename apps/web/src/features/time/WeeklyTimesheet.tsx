import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeEntry, Project } from '@flowpilot/shared';
import { api } from '../../lib/api';

type TimeEntryWithProject = TimeEntry & { project?: Pick<Project, 'name'> };

export function WeeklyTimesheet() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);

  useEffect(() => {
    api
      .get<{ data: TimeEntryWithProject[] }>('/time-entries')
      .then((res) => setEntries(res.data.data ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="mt-6 border border-border rounded-lg overflow-hidden bg-background">
      <div className="p-4 border-b border-border bg-gray-900 font-medium">
        {t('time.weeklyTimesheet')}
      </div>
      <div className="p-4 text-text-secondary">
        {entries.length === 0 ? (
          'No entries found.'
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between border-b border-border py-2"
              >
                <span>
                  {entry.project?.name} - {entry.description}
                </span>
                <span>{new Date(entry.startedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
