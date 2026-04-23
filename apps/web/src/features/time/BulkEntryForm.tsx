import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project, WorkType } from '@flowpilot/shared';
import { uuid } from '@flowpilot/shared';
import { api } from '../../lib/api';

interface BulkEntryFormProps {
  projects: Project[];
  workTypes: WorkType[];
  onSuccess: () => void;
}

export function BulkEntryForm({
  projects,
  workTypes,
  onSuccess,
}: BulkEntryFormProps) {
  const { t } = useTranslation();
  const emptyRow = () => ({
    id: uuid(),
    date: '',
    projectId: '',
    workTypeId: '',
    description: '',
    duration: '',
  });
  const [rows, setRows] = useState([emptyRow()]);

  const handleSubmit = async () => {
    try {
      for (const row of rows) {
        if (!row.projectId || !row.date || !row.duration) continue;
        const startedAt = new Date(row.date).toISOString();
        const endedAt = new Date(
          new Date(row.date).getTime() + Number(row.duration) * 60000,
        ).toISOString();
        await api.post('/time-entries', {
          projectId: row.projectId,
          workTypeId: row.workTypeId,
          description: row.description,
          startedAt,
          endedAt,
          isBillable: true,
        });
      }
      onSuccess();
      setRows([emptyRow()]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-6 mt-4">
      <h3 className="text-lg font-medium">{t('time.bulkEntry')}</h3>
      {rows.map((row, i) => (
        <div key={row.id} className="flex gap-2">
          <input
            type="date"
            className="bg-background border border-border rounded p-2 w-32"
            value={row.date}
            onChange={(e) => {
              const newRows = [...rows];
              newRows[i].date = e.target.value;
              setRows(newRows);
            }}
          />
          <select
            className="bg-background border border-border rounded p-2 w-32"
            value={row.projectId}
            onChange={(e) => {
              const newRows = [...rows];
              newRows[i].projectId = e.target.value;
              setRows(newRows);
            }}
          >
            <option value="">{t('time.project')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="bg-background border border-border rounded p-2 w-32"
            value={row.workTypeId}
            onChange={(e) => {
              const newRows = [...rows];
              newRows[i].workTypeId = e.target.value;
              setRows(newRows);
            }}
          >
            <option value="">{t('time.workType')}</option>
            {workTypes.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min"
            className="bg-background border border-border rounded p-2 w-20"
            value={row.duration}
            onChange={(e) => {
              const newRows = [...rows];
              newRows[i].duration = e.target.value;
              setRows(newRows);
            }}
          />
          <input
            type="text"
            placeholder={t('time.description')}
            className="bg-background border border-border rounded p-2 flex-1"
            value={row.description}
            onChange={(e) => {
              const newRows = [...rows];
              newRows[i].description = e.target.value;
              setRows(newRows);
            }}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          className="bg-gray-800 text-white border border-border hover:bg-gray-700 rounded px-4 py-2"
          onClick={() => setRows([...rows, emptyRow()])}
        >
          {t('time.addRow')}
        </button>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
          onClick={handleSubmit}
        >
          {t('time.submitAll')}
        </button>
      </div>
    </div>
  );
}
