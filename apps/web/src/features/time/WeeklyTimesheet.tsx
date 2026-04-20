import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export function WeeklyTimesheet() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    api.get('/time-entries').then(res => setEntries(res.data.data || res.data)).catch(console.error);
  }, []);

  return (
    <div className="mt-6 border border-border rounded-lg overflow-hidden bg-background">
      <div className="p-4 border-b border-border bg-gray-900 font-medium">
        {t('time.weeklyTimesheet')}
      </div>
      <div className="p-4 text-text-secondary">
        {entries.length === 0 ? "No entries found." : (
          <div className="space-y-2">
            {entries.map((entry: any) => (
              <div key={entry.id} className="flex justify-between border-b border-border py-2">
                <span>{entry.project?.name} - {entry.description}</span>
                <span>{new Date(entry.startedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
