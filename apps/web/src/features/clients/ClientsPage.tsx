import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Client } from './types';
import { ClientForm } from './components/ClientForm';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(
        `/clients?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
      );
      setClients(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchClients]);

  const handleSaveClient = async (formData: Partial<Client>) => {
    await api.post('/clients', formData);
    setShowForm(false);
    fetchClients();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Clients</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your clients and contacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          New Client
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#2d2d2d] flex justify-between items-center">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[#222] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#2d2d2d]/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">IČO / DIČ</th>
                <th className="px-4 py-3">Email / Phone</th>
                <th className="px-4 py-3 text-center">Projects</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No clients found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-[#2d2d2d] hover:bg-[#2d2d2d]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/clients/${client.id}`}
                        className="font-medium text-[#e5e5e5] hover:text-violet-400 transition-colors"
                      >
                        {client.name}
                      </Link>
                      {!client.isCompany && (
                        <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                          Individual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {client.ic ? (
                        <div className="flex flex-col">
                          <span>{client.ic}</span>
                          {client.dic && (
                            <span className="text-xs text-gray-500">
                              {client.dic}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <a
                          href={`mailto:${client.email}`}
                          className="text-blue-400 hover:underline"
                        >
                          {client.email || '-'}
                        </a>
                        {client.phone && (
                          <span className="text-xs text-gray-500">
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2d2d2d] text-[#e5e5e5] text-xs font-medium">
                        {client.projectsCount ?? client._count?.projects ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="p-4 border-t border-[#2d2d2d] flex justify-between items-center text-sm text-gray-400">
            <span>
              Showing {clients.length} of {total}
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-[#2d2d2d] rounded hover:bg-[#2d2d2d] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={clients.length < 20}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-[#2d2d2d] rounded hover:bg-[#2d2d2d] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          onSave={handleSaveClient}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
