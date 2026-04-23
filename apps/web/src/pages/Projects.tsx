import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import {
  ProjectForm,
  ProjectFormValues,
} from '../features/projects/components/ProjectForm';

interface Project extends ProjectFormValues {
  id: string;
  client?: {
    id: string;
    name: string;
  } | null;
}

export default function Projects() {
  const { user } = useAuthStore();
  const isViewer = user?.role === 'viewer';

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(
        `/projects?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
      );
      setProjects(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchProjects]);

  const handleCreate = () => {
    if (isViewer) return;
    setFormMode('create');
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    if (isViewer) return;
    setFormMode('edit');
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (isViewer) return;
    if (!window.confirm('Opravdu chcete smazat tento projekt?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  const handleSave = async (data: ProjectFormValues) => {
    try {
      if (formMode === 'create') {
        await api.post('/projects', data);
      } else if (formMode === 'edit' && editingProject) {
        await api.put(`/projects/${editingProject.id}`, data);
      }
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to save project', error);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('cs-CZ');
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency || 'CZK',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    archived: 'bg-gray-500/20 text-gray-400',
    on_hold: 'bg-yellow-500/20 text-yellow-400',
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktivní';
      case 'archived':
        return 'Archivovaný';
      case 'on_hold':
        return 'Pozastavený';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Projekty</h1>
          <p className="text-gray-400 text-sm mt-1">
            Správa projektů, klientů a rozpočtů.
          </p>
        </div>
        {!isViewer && (
          <button
            type="button"
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-medium transition-colors whitespace-nowrap"
          >
            Nový projekt
          </button>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#2d2d2d]">
          <input
            type="text"
            placeholder="Hledat projekty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-[#222] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#2d2d2d]/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Název</th>
                <th className="px-4 py-3">Klient</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3 whitespace-nowrap">Termín</th>
                <th className="px-4 py-3 text-right">Hodinová sazba</th>
                {!isViewer && <th className="px-4 py-3 text-right">Akce</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isViewer ? 5 : 6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Načítání projektů...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={isViewer ? 5 : 6}
                    className="px-4 py-16 text-center"
                  >
                    <p className="text-gray-400 mb-4">
                      {search
                        ? 'Nenalezeny žádné projekty odpovídající hledání.'
                        : 'Zatím nemáte žádné projekty.'}
                    </p>
                    {!isViewer && !search && (
                      <button
                        type="button"
                        onClick={handleCreate}
                        className="bg-[#2d2d2d] hover:bg-[#333] text-white px-4 py-2 rounded transition-colors"
                      >
                        Vytvořit první projekt
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-[#2d2d2d] hover:bg-[#2d2d2d]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-medium text-[#e5e5e5] hover:text-violet-400 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {project.client ? (
                        <Link
                          to={`/clients/${project.client.id}`}
                          className="hover:underline text-gray-300"
                        >
                          {project.client.name}
                        </Link>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          statusColors[project.status] ||
                          'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {translateStatus(project.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {formatDate(project.startDate)} -{' '}
                      {formatDate(project.endDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(project.hourlyRate, project.currency)}
                    </td>
                    {!isViewer && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(project)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            Upravit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(project.id)}
                            className="text-red-400/80 hover:text-red-400 transition-colors"
                          >
                            Smazat
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="p-4 border-t border-[#2d2d2d] flex justify-between items-center text-sm text-gray-400">
            <span>
              Zobrazeno {projects.length} z {total}
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-[#2d2d2d] rounded hover:bg-[#2d2d2d] disabled:opacity-50 transition-colors"
              >
                Předchozí
              </button>
              <button
                type="button"
                disabled={projects.length < 20}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-[#2d2d2d] rounded hover:bg-[#2d2d2d] disabled:opacity-50 transition-colors"
              >
                Další
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ProjectForm
          mode={formMode}
          initialValues={editingProject || undefined}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
