import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

interface Props {
  onClose: () => void;
  onConfirm: (projectId: string, dateFrom: string, dateTo: string) => void;
}

export function TimeEntriesModal({ onClose, onConfirm }: Props) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preview, setPreview] = useState<
    { description: string; quantity: number; unit: string; unitPrice: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data.data || []));
  }, []);

  const handlePreview = async () => {
    if (!projectId || !dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const { data } = await api.get(
        `/invoices/preview-from-entries?projectId=${projectId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );
      setPreview(data.lineItems || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-[#e5e5e5] mb-4">
          Add from Time Entries
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="time-entries-project"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Project
            </label>
            <select
              id="time-entries-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="time-entries-date-from"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                From
              </label>
              <input
                id="time-entries-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
              />
            </div>
            <div>
              <label
                htmlFor="time-entries-date-to"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                To
              </label>
              <input
                id="time-entries-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="w-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white p-2 rounded transition-colors"
          >
            {loading ? 'Loading...' : 'Preview Entries'}
          </button>

          {preview.length > 0 && (
            <div className="mt-4 border border-[#2d2d2d] rounded p-4 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2 text-gray-400">
                Preview:
              </h4>
              <ul className="text-sm space-y-1">
                {preview.map((item) => (
                  <li
                    key={`${item.description}-${item.quantity}-${item.unit}-${item.unitPrice}`}
                    className="flex justify-between text-[#e5e5e5]"
                  >
                    <span>{item.description}</span>
                    <span>
                      {item.quantity} {item.unit} x {item.unitPrice}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-[#e5e5e5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(projectId, dateFrom, dateTo)}
            disabled={!preview.length}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            Add to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
