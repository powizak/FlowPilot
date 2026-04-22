import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';

interface WorkType {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
  isActive: boolean;
}

export function WorkTypesSettings() {
  const { showToast, ToastComponent } = useToast();
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkTypes = useCallback(async () => {
    try {
      const { data } = await api.get<WorkType[]>('/work-types');
      setWorkTypes(data);
    } catch {
      showToast('Failed to load work types', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWorkTypes();
  }, [fetchWorkTypes]);

  const handleAdd = () => {
    setWorkTypes([
      ...workTypes,
      {
        id: 'new-' + Date.now(),
        name: '',
        hourlyRate: 0,
        color: '#3b82f6',
        isActive: true,
      },
    ]);
  };

  const handleSave = async (wt: WorkType) => {
    try {
      if (wt.id.startsWith('new-')) {
        await api.post('/work-types', {
          name: wt.name,
          hourlyRate: Number(wt.hourlyRate),
          color: wt.color,
        });
        showToast('Work type created');
      } else {
        await api.put(`/work-types/${wt.id}`, {
          name: wt.name,
          hourlyRate: Number(wt.hourlyRate),
          color: wt.color,
          isActive: wt.isActive,
        });
        showToast('Work type updated');
      }
      fetchWorkTypes();
    } catch {
      showToast('Failed to save work type', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('new-')) {
      setWorkTypes(workTypes.filter((w) => w.id !== id));
      return;
    }
    try {
      await api.delete(`/work-types/${id}`);
      showToast('Work type deleted');
      fetchWorkTypes();
    } catch {
      showToast('Failed to delete work type', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-100">Work Types</h2>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
        >
          Add Work Type
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Name</th>
              <th className="px-4 py-3">Rate (CZK/h)</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workTypes.map((wt) => (
              <tr
                key={wt.id}
                className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700/50"
              >
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={wt.name}
                    onChange={(e) =>
                      setWorkTypes(
                        workTypes.map((w) =>
                          w.id === wt.id ? { ...w, name: e.target.value } : w,
                        ),
                      )
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-gray-100 focus:border-blue-500 focus:outline-none"
                    placeholder="E.g. Development"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={wt.hourlyRate}
                    onChange={(e) =>
                      setWorkTypes(
                        workTypes.map((w) =>
                          w.id === wt.id
                            ? { ...w, hourlyRate: Number(e.target.value) }
                            : w,
                        ),
                      )
                    }
                    className="w-24 bg-gray-900 border border-gray-700 rounded p-1 text-gray-100 focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="color"
                    value={wt.color}
                    onChange={(e) =>
                      setWorkTypes(
                        workTypes.map((w) =>
                          w.id === wt.id ? { ...w, color: e.target.value } : w,
                        ),
                      )
                    }
                    className="h-8 w-12 bg-transparent border-0 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={wt.isActive}
                      onChange={(e) =>
                        setWorkTypes(
                          workTypes.map((w) =>
                            w.id === wt.id
                              ? { ...w, isActive: e.target.checked }
                              : w,
                          ),
                        )
                      }
                    />
                    <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSave(wt)}
                    className="text-blue-500 hover:text-blue-400 mr-3"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(wt.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No work types found. Add one to get started.
          </div>
        )}
      </div>
      {ToastComponent}
    </div>
  );
}
