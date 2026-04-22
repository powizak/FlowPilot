import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';

const defaultInvoiceSettings = {
  'invoice.numberFormat': '{YYYY}-{SEQ}',
  'invoice.defaultPaymentTermsDays': 14,
  'invoice.defaultNote': '',
};

interface SettingRecord {
  key: string;
  value: string | number;
}

export function InvoiceSettings() {
  const { showToast, ToastComponent } = useToast();
  const [settings, setSettings] = useState<Record<string, string | number>>(
    defaultInvoiceSettings,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get<SettingRecord[]>('/settings');
        const newSettings = { ...defaultInvoiceSettings };
        data.forEach((s) => {
          if (s.key.startsWith('invoice.')) {
            newSettings[s.key] = s.value;
          }
        });
        setSettings(newSettings);
      } catch {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          api.put(`/settings/${key}`, { value }),
        ),
      );
      showToast('Settings saved successfully');
    } catch {
      showToast('Failed to save settings', 'error');
    }
  };

  const getPreview = (format: string) => {
    const now = new Date();
    return format
      .replace('{YYYY}', now.getFullYear().toString())
      .replace('{YY}', now.getFullYear().toString().slice(-2))
      .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace('{DD}', now.getDate().toString().padStart(2, '0'))
      .replace('{SEQ}', '0001');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-6">
        Invoice Settings
      </h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="invoice-settings-number-format"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Invoice Number Format
          </label>
          <input
            id="invoice-settings-number-format"
            type="text"
            value={settings['invoice.numberFormat']}
            onChange={(e) =>
              setSettings({
                ...settings,
                'invoice.numberFormat': e.target.value,
              })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. INV-{YYYY}-{SEQ}"
          />
          <div className="mt-2 text-sm text-gray-400">
            Available variables:{' '}
            <code className="bg-gray-700 px-1 rounded text-gray-300">{`{YYYY}`}</code>
            ,{' '}
            <code className="bg-gray-700 px-1 rounded text-gray-300">{`{YY}`}</code>
            ,{' '}
            <code className="bg-gray-700 px-1 rounded text-gray-300">{`{MM}`}</code>
            ,{' '}
            <code className="bg-gray-700 px-1 rounded text-gray-300">{`{DD}`}</code>
            ,{' '}
            <code className="bg-gray-700 px-1 rounded text-gray-300">{`{SEQ}`}</code>
          </div>
          <div className="mt-2 p-3 bg-gray-900 border border-gray-700 rounded-md">
            <span className="text-gray-400 text-sm">Preview: </span>
            <span className="font-mono text-white">
              {getPreview(settings['invoice.numberFormat'] || '')}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="invoice-settings-payment-terms"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Default Payment Terms (Days)
          </label>
          <input
            id="invoice-settings-payment-terms"
            type="number"
            min="0"
            value={settings['invoice.defaultPaymentTermsDays']}
            onChange={(e) =>
              setSettings({
                ...settings,
                'invoice.defaultPaymentTermsDays': Number(e.target.value),
              })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="invoice-settings-default-note"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Default Invoice Note
          </label>
          <textarea
            id="invoice-settings-default-note"
            rows={4}
            value={settings['invoice.defaultNote'] || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                'invoice.defaultNote': e.target.value,
              })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none resize-y"
            placeholder="Thank you for your business."
          />
        </div>

        <button
          type="submit"
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Save Settings
        </button>
      </form>
      {ToastComponent}
    </div>
  );
}
