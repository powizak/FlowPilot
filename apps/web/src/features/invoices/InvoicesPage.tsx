import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { Invoice } from './types';

const statusColors = {
  DRAFT: 'bg-gray-500/20 text-gray-400',
  SENT: 'bg-blue-500/20 text-blue-400',
  VIEWED: 'bg-purple-500/20 text-purple-400',
  PAID: 'bg-green-500/20 text-green-400',
  OVERDUE: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-500 line-through',
};

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data.data || []));
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      }).toString();

      const { data } = await api.get(`/invoices?${query}`);
      setInvoices(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Invoices</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your billing and payments.
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> New Invoice
        </Link>
      </div>

      <div className="mb-6 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg pl-9 pr-4 py-2 text-sm text-[#e5e5e5] focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#e5e5e5] transition-colors"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#2d2d2d]">
            <div>
              <label
                htmlFor="invoice-filter-status"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Status
              </label>
              <select
                id="invoice-filter-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 text-sm text-[#e5e5e5] focus:border-violet-500"
              >
                <option value="">All Statuses</option>
                {Object.keys(statusColors).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="invoice-filter-client"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Client
              </label>
              <select
                id="invoice-filter-client"
                value={filters.clientId}
                onChange={(e) =>
                  setFilters({ ...filters, clientId: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 text-sm text-[#e5e5e5] focus:border-violet-500"
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="invoice-filter-date-from"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Date From
              </label>
              <input
                id="invoice-filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 text-sm text-[#e5e5e5] focus:border-violet-500"
              />
            </div>
            <div>
              <label
                htmlFor="invoice-filter-date-to"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Date To
              </label>
              <input
                id="invoice-filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 text-sm text-[#e5e5e5] focus:border-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-[#e5e5e5]">
          <thead className="bg-[#2d2d2d] text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Invoice Number</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Issue Date</th>
              <th className="px-6 py-4 font-medium">Due Date</th>
              <th className="px-6 py-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-[#2d2d2d]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="font-medium text-violet-400 hover:text-violet-300"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{inv.client?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusColors[inv.status] || ''}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${inv.total.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {total > 20 && (
          <div className="px-6 py-4 border-t border-[#2d2d2d] flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of{' '}
              {total} entries
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-[#2d2d2d] text-[#e5e5e5] rounded disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-[#2d2d2d] text-[#e5e5e5] rounded disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
