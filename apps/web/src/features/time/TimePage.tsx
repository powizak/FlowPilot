import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project, Task, WorkType } from '@flowpilot/shared';
import { ManualEntryForm } from './ManualEntryForm';
import { BulkEntryForm } from './BulkEntryForm';
import { WeeklyTimesheet } from './WeeklyTimesheet';
import { TimeCalendar } from './TimeCalendar';
import { api } from '../../lib/api';

export function TimePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'timesheet' | 'calendar'>('timesheet');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [entriesVersion, setEntriesVersion] = useState(0);
  const refreshEntries = () => setEntriesVersion((v) => v + 1);

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/work-types'),
      api.get('/tasks/my'),
    ])
      .then(([p, w, tks]) => {
        setProjects(p.data.data ?? []);
        setWorkTypes(w.data.data ?? []);
        setTasks(tks.data.data ?? []);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto text-foreground">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">{t('time.title')}</h1>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${tab === 'timesheet' ? 'bg-blue-600 text-white' : 'bg-background hover:bg-hover'}`}
            onClick={() => setTab('timesheet')}
          >
            {t('time.timesheet')}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${tab === 'calendar' ? 'bg-blue-600 text-white' : 'bg-background hover:bg-hover'}`}
            onClick={() => setTab('calendar')}
          >
            {t('time.calendar')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {tab === 'timesheet' ? (
            <WeeklyTimesheet key={entriesVersion} />
          ) : (
            <TimeCalendar key={entriesVersion} />
          )}
        </div>
        <div className="space-y-6">
          <ManualEntryForm
            projects={projects}
            tasks={tasks}
            workTypes={workTypes}
            onSuccess={refreshEntries}
          />
          <BulkEntryForm
            projects={projects}
            workTypes={workTypes}
            onSuccess={refreshEntries}
          />
        </div>
      </div>
    </div>
  );
}

export default TimePage;
