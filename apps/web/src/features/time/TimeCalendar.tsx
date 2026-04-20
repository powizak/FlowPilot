import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export function TimeCalendar() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    api.get('/time-entries').then(res => setEntries(res.data.data || res.data)).catch(console.error);
  }, []);

  return (
    <div className="mt-6 border border-border rounded-lg overflow-hidden bg-background">
      <div className="p-4 border-b border-border bg-gray-900 font-medium">
        {t('time.calendar')}
      </div>
      <div className="p-4 grid grid-cols-7 gap-2 h-96">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="border border-border rounded p-2 flex flex-col items-center">
            <span className="font-medium text-text-secondary">{day}</span>
            <div className="w-full mt-2 space-y-1">
              {entries.slice(0, 2).map((entry, idx) => (
                <div key={idx} className="bg-blue-900/50 border border-blue-800 text-xs p-1 rounded text-blue-200 truncate">
                  {entry.project?.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
