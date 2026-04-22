import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Invoice, LineItem } from './types';
import { LineItemsTable } from './components/LineItemsTable';
import { TimeEntriesModal } from './components/TimeEntriesModal';
import { AIActionButton } from '../../components/AIActionButton';

export function InvoiceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; bankName: string; accountNumber: string }[]
  >([]);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientId: '',
    dueDate: '',
    bankAccountId: '',
    note: '',
    lineItems: [],
  });

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data.data || []));
    api
      .get('/bank-accounts')
      .then(({ data }) => setBankAccounts(data.data || []));

    if (isEdit) {
      api
        .get(`/invoices/${id}`)
        .then(({ data }) => setFormData(data.data ?? data));
    }
  }, [id, isEdit]);

  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub =
      formData.lineItems?.reduce((sum, item) => sum + (item.total || 0), 0) ||
      0;
    const vat =
      formData.lineItems?.reduce(
        (sum, item) => sum + ((item.total || 0) * (item.vatPercent || 0)) / 100,
        0,
      ) || 0;
    const discount = formData.discountAmount || 0;
    return { subtotal: sub, vatAmount: vat, total: sub + vat - discount };
  }, [formData.lineItems, formData.discountAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/invoices/${id}`, formData);
      } else {
        const payload = {
          clientId: formData.clientId,
          dueDate: formData.dueDate,
          bankAccountId: formData.bankAccountId || undefined,
          note: formData.note || undefined,
        };
        const { data } = await api.post('/invoices', payload);
        const invoice = data.data ?? data;

        for (const item of formData.lineItems || []) {
          await api.post(`/invoices/${invoice.id}/line-items`, item);
        }
        navigate(`/invoices/${invoice.id}`);
        return;
      }
      navigate('/invoices');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntriesAdd = async (
    projectId: string,
    dateFrom: string,
    dateTo: string,
  ) => {
    try {
      const { data } = await api.post('/invoices/from-entries', {
        projectId,
        dateFrom,
        dateTo,
        clientId: formData.clientId,
        dueDate: formData.dueDate,
      });
      const invoice = data.data ?? data;
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e5e5e5]">
          {isEdit ? 'Edit Invoice' : 'New Invoice'}
        </h1>
        <div className="flex items-center gap-3">
          <AIActionButton
            skillId="invoice-draft"
            label="AI Draft"
            context={{ clientId: formData.clientId }}
            previewTitle="Generated Invoice Draft"
            onResult={(result) => {
              setFormData((prev) => ({
                ...prev,
                note: result.note || prev.note,
                lineItems: result.lineItems || prev.lineItems,
              }));
            }}
            previewRenderer={(result) => (
              <div className="space-y-4">
                {result.note && (
                  <div>
                    <strong>Note:</strong>
                    <p className="text-sm text-zinc-300">{result.note}</p>
                  </div>
                )}
                {result.lineItems && result.lineItems.length > 0 && (
                  <div>
                    <strong>Line Items:</strong>
                    <ul className="list-disc pl-4 space-y-2 mt-2">
                      {result.lineItems.map((item: any, i: number) => (
                        <li key={i} className="text-sm text-zinc-300">
                          {item.description} - {item.quantity} x $
                          {item.unitPrice} = ${item.total}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-6"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              required
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bank Account
            </label>
            <select
              value={formData.bankAccountId}
              onChange={(e) =>
                setFormData({ ...formData, bankAccountId: e.target.value })
              }
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
            >
              <option value="">Select bank account...</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Note
            </label>
            <input
              type="text"
              value={formData.note || ''}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-2 focus:border-violet-500 text-[#e5e5e5]"
            />
          </div>
        </div>

        <LineItemsTable
          lineItems={formData.lineItems || []}
          onChange={(items) =>
            setFormData({ ...formData, lineItems: items as LineItem[] })
          }
          onOpenTimeEntriesModal={() => setShowTimeModal(true)}
        />

        <div className="border-t border-[#2d2d2d] pt-6 flex justify-end">
          <div className="w-64 space-y-2 text-sm text-[#e5e5e5]">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VAT:</span>
              <span>${vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#2d2d2d]">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-[#e5e5e5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>

      {showTimeModal && (
        <TimeEntriesModal
          onClose={() => setShowTimeModal(false)}
          onConfirm={handleTimeEntriesAdd}
        />
      )}
    </div>
  );
}
