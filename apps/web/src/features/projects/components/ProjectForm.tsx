import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
  status: string;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({
  initialData,
  onSave,
  onCancel,
}: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    clientId: initialData?.clientId || '',
    status: initialData?.status || 'active',
  });

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/clients?limit=100');
        setClients(data.data || []);
      } catch (error) {
        console.error('Failed to fetch clients', error);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
      <div className="bg-[#1a1a1a] border-[#2d2d2d] md:border w-full h-full md:h-auto md:max-w-lg md:rounded-lg shadow-2xl flex flex-col">
        <div className="p-4 md:p-6 border-b border-[#2d2d2d] flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-[#e5e5e5]">
            {initialData ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
            type="button"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1"
        >
          <div className="space-y-1">
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-gray-400"
            >
              Name
            </label>
            <input
              id="project-name"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="project-client"
              className="text-sm font-medium text-gray-400"
            >
              Client
            </label>
            <select
              id="project-client"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
            >
              <option value="">No Client (Internal)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="project-description"
              className="text-sm font-medium text-gray-400"
            >
              Description
            </label>
            <textarea
              id="project-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="project-status"
              className="text-sm font-medium text-gray-400"
            >
              Status
            </label>
            <select
              id="project-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="pt-4 border-t border-[#2d2d2d] flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded text-sm font-medium text-gray-300 hover:bg-[#2d2d2d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
