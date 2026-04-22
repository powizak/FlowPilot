import React, { useState, useEffect } from 'react';
import type { BankAccount } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';

type DraftBankAccount = Omit<BankAccount, 'id' | 'isActive'> & {
  id: string;
  isNew?: boolean;
};

const CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP'];

const emptyDraft = (): DraftBankAccount => ({
  id: 'new-' + Date.now(),
  name: '',
  bankName: '',
  accountNumber: '',
  iban: '',
  swift: '',
  currency: 'CZK',
  isDefault: false,
  isNew: true,
});

export function BankAccountsSettings() {
  const { showToast, ToastComponent } = useToast();
  const [accounts, setAccounts] = useState<DraftBankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get<{ data: BankAccount[] }>('/bank-accounts');
      setAccounts(
        (data.data ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          bankName: a.bankName ?? '',
          accountNumber: a.accountNumber,
          iban: a.iban ?? '',
          swift: a.swift ?? '',
          currency: a.currency,
          isDefault: a.isDefault,
        })),
      );
    } catch {
      showToast('Failed to load bank accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const update = (id: string, patch: Partial<DraftBankAccount>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  };

  const handleAdd = () => setAccounts((prev) => [...prev, emptyDraft()]);

  const buildPayload = (a: DraftBankAccount) => ({
    name: a.name,
    bankName: a.bankName || undefined,
    accountNumber: a.accountNumber,
    iban: a.iban || undefined,
    swift: a.swift || undefined,
    currency: a.currency,
    isDefault: a.isDefault,
  });

  const handleSave = async (a: DraftBankAccount) => {
    if (!a.name.trim() || !a.accountNumber.trim()) {
      showToast('Name and account number are required', 'error');
      return;
    }
    try {
      if (a.isNew) {
        await api.post('/bank-accounts', buildPayload(a));
        showToast('Bank account created');
      } else {
        await api.put(`/bank-accounts/${a.id}`, buildPayload(a));
        showToast('Bank account updated');
      }
      fetchAccounts();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to save bank account';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (a: DraftBankAccount) => {
    if (a.isNew) {
      setAccounts((prev) => prev.filter((x) => x.id !== a.id));
      return;
    }
    if (!confirm(`Delete bank account "${a.name}"?`)) return;
    try {
      await api.delete(`/bank-accounts/${a.id}`);
      showToast('Bank account deleted');
      fetchAccounts();
    } catch {
      showToast('Failed to delete bank account', 'error');
    }
  };

  const handleSetDefault = async (a: DraftBankAccount) => {
    if (a.isNew) {
      showToast('Save the account first', 'error');
      return;
    }
    try {
      await api.put(`/bank-accounts/${a.id}/default`, {});
      showToast('Default updated');
      fetchAccounts();
    } catch {
      showToast('Failed to set default', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium text-gray-100">Bank Accounts</h2>
          <p className="text-sm text-gray-400 mt-1">
            Accounts shown in the invoice form. One default per currency.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
        >
          Add Bank Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bank accounts yet. Add one to use it on invoices.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="border border-gray-700 bg-gray-900 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Label">
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => update(a.id, { name: e.target.value })}
                    placeholder="E.g. Main CZK"
                    className={inputCls}
                  />
                </Field>
                <Field label="Bank name">
                  <input
                    type="text"
                    value={a.bankName ?? ''}
                    onChange={(e) => update(a.id, { bankName: e.target.value })}
                    placeholder="E.g. Fio banka"
                    className={inputCls}
                  />
                </Field>
                <Field label="Account number">
                  <input
                    type="text"
                    value={a.accountNumber}
                    onChange={(e) =>
                      update(a.id, { accountNumber: e.target.value })
                    }
                    placeholder="2201234567/2010"
                    className={inputCls}
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={a.currency}
                    onChange={(e) => update(a.id, { currency: e.target.value })}
                    className={inputCls}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="IBAN">
                  <input
                    type="text"
                    value={a.iban ?? ''}
                    onChange={(e) => update(a.id, { iban: e.target.value })}
                    placeholder="CZ6508000000192000145399"
                    className={inputCls}
                  />
                </Field>
                <Field label="SWIFT / BIC">
                  <input
                    type="text"
                    value={a.swift ?? ''}
                    onChange={(e) => update(a.id, { swift: e.target.value })}
                    placeholder="GIBACZPX"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={a.isDefault}
                    onChange={(e) =>
                      update(a.id, { isDefault: e.target.checked })
                    }
                    className="rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Default for {a.currency}</span>
                </label>
                <div className="space-x-3">
                  {!a.isNew && !a.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(a)}
                      className="text-sm text-gray-400 hover:text-gray-200"
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave(a)}
                    className="text-sm text-blue-500 hover:text-blue-400"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {ToastComponent}
    </div>
  );
}

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-100 focus:border-blue-500 focus:outline-none text-sm';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
