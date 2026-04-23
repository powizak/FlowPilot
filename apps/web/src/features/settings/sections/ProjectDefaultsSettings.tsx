import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import type { ApiResponse, WorkType } from '@flowpilot/shared';
import { useToast } from './GeneralSettings';

interface SettingRecord {
  key: string;
  value: string;
}

const defaultValues = {
  hourlyRate: '0',
  currency: 'CZK',
  defaultVatRate: '21',
  billableByDefault: 'true',
  defaultWorkTypeId: '',
};

export function ProjectDefaultsSettings() {
  const { t } = useTranslation();
  const { showToast, ToastComponent } = useToast();
  const { user } = useAuthStore();
  const isViewer = user?.role === 'viewer';

  const [settings, setSettings] =
    useState<Record<string, string>>(defaultValues);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, workTypesRes] = await Promise.all([
          api.get<ApiResponse<SettingRecord[]>>('/settings'),
          api.get<WorkType[]>('/work-types'),
        ]);

        const settingsData = settingsRes.data.data;
        const workTypesData = workTypesRes.data;

        const newSettings = { ...defaultValues };
        settingsData.forEach((s) => {
          if (s.key === 'project.defaults.hourlyRate')
            newSettings.hourlyRate = s.value;
          if (s.key === 'project.defaults.currency')
            newSettings.currency = s.value;
          if (s.key === 'project.defaults.defaultVatRate')
            newSettings.defaultVatRate = s.value;
          if (s.key === 'project.defaults.billableByDefault')
            newSettings.billableByDefault = s.value;
          if (s.key === 'project.defaults.defaultWorkTypeId')
            newSettings.defaultWorkTypeId = s.value;
        });

        setSettings(newSettings);
        setWorkTypes(workTypesData);
      } catch (err) {
        showToast(
          t('settings.projectDefaults.loadError', 'Failed to load settings'),
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast, t]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    setSaving(true);
    try {
      const payload = [
        { key: 'project.defaults.hourlyRate', value: settings.hourlyRate },
        { key: 'project.defaults.currency', value: settings.currency },
        {
          key: 'project.defaults.defaultVatRate',
          value: settings.defaultVatRate,
        },
        {
          key: 'project.defaults.billableByDefault',
          value: settings.billableByDefault,
        },
        {
          key: 'project.defaults.defaultWorkTypeId',
          value: settings.defaultWorkTypeId,
        },
      ];

      await api.put('/settings/bulk', { settings: payload });
      showToast(
        t(
          'settings.projectDefaults.saveSuccess',
          'Settings saved successfully',
        ),
        'success',
      );
    } catch (err) {
      showToast(
        t('settings.projectDefaults.saveError', 'Failed to save settings'),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-gray-400">{t('common.loading', 'Loading...')}</div>
    );

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-6">
        {t('settings.projectDefaults.title', 'Project Defaults')}
      </h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="hourlyRate"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.projectDefaults.hourlyRate', 'Default Hourly Rate')}
          </label>
          <input
            id="hourlyRate"
            type="number"
            value={settings.hourlyRate}
            onChange={(e) =>
              setSettings({ ...settings, hourlyRate: e.target.value })
            }
            disabled={isViewer}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.projectDefaults.currency', 'Currency')}
          </label>
          <select
            id="currency"
            value={settings.currency}
            onChange={(e) =>
              setSettings({ ...settings, currency: e.target.value })
            }
            disabled={isViewer}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="defaultVatRate"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t(
              'settings.projectDefaults.defaultVatRate',
              'Default VAT Rate (%)',
            )}
          </label>
          <input
            id="defaultVatRate"
            type="number"
            min="0"
            max="100"
            value={settings.defaultVatRate}
            onChange={(e) =>
              setSettings({ ...settings, defaultVatRate: e.target.value })
            }
            disabled={isViewer}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="flex items-center space-x-3 text-sm font-medium text-gray-400">
            <input
              type="checkbox"
              checked={settings.billableByDefault === 'true'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  billableByDefault: e.target.checked ? 'true' : 'false',
                })
              }
              disabled={isViewer}
              className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
            />
            <span>
              {t(
                'settings.projectDefaults.billableByDefault',
                'Billable by Default',
              )}
            </span>
          </label>
        </div>

        <div>
          <label
            htmlFor="defaultWorkTypeId"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t(
              'settings.projectDefaults.defaultWorkTypeId',
              'Default Work Type',
            )}
          </label>
          <select
            id="defaultWorkTypeId"
            value={settings.defaultWorkTypeId}
            onChange={(e) =>
              setSettings({ ...settings, defaultWorkTypeId: e.target.value })
            }
            disabled={isViewer}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">{t('common.none', 'None')}</option>
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>
                {wt.name}
              </option>
            ))}
          </select>
        </div>

        {!isViewer && (
          <button
            type="submit"
            disabled={saving}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {saving
              ? t('common.saving', 'Saving...')
              : t('common.save', 'Save Settings')}
          </button>
        )}
      </form>
      {ToastComponent}
    </div>
  );
}
