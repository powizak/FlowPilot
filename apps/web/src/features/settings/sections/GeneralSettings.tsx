import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../lib/api';

interface SettingRecord {
  key: string;
  value: unknown;
}

interface GeneralSettingsState {
  appName: string;
  locale: string;
  timezone: string;
  currency: string;
}

const SETTING_KEYS = {
  appName: 'app.name',
  locale: 'app.locale',
  timezone: 'app.timezone',
  currency: 'app.currency',
} as const;

const defaultGeneralSettings: GeneralSettingsState = {
  appName: '',
  locale: 'cs',
  timezone: 'Europe/Prague',
  currency: 'CZK',
};

function getTimezones(): string[] {
  const intlWithValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlWithValues.supportedValuesOf === 'function') {
    try {
      return intlWithValues.supportedValuesOf('timeZone');
    } catch {
      // fall through to fallback list
    }
  }
  return [
    'UTC',
    'Europe/Prague',
    'Europe/Bratislava',
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
  ];
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  return {
    toast,
    showToast,
    ToastComponent: toast ? (
      <div
        className={`fixed bottom-4 right-4 p-4 rounded shadow-lg text-white z-50 transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      >
        {toast.message}
      </div>
    ) : null,
  };
}

export function GeneralSettings() {
  const { t, i18n } = useTranslation();
  const { showToast, ToastComponent } = useToast();
  const [settings, setSettings] = useState<GeneralSettingsState>(
    defaultGeneralSettings,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const timezones = useMemo(() => getTimezones(), []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get<SettingRecord[]>('/settings');
        const next: GeneralSettingsState = { ...defaultGeneralSettings };
        data.forEach((s) => {
          const value =
            typeof s.value === 'string' ? s.value : String(s.value ?? '');
          if (s.key === SETTING_KEYS.appName) next.appName = value;
          if (s.key === SETTING_KEYS.locale) next.locale = value;
          if (s.key === SETTING_KEYS.timezone) next.timezone = value;
          if (s.key === SETTING_KEYS.currency) next.currency = value;
        });
        setSettings(next);
      } catch {
        showToast(
          t('settings.general.loadError', 'Failed to load settings'),
          'error',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast, t]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = [
        { key: SETTING_KEYS.appName, value: settings.appName },
        { key: SETTING_KEYS.locale, value: settings.locale },
        { key: SETTING_KEYS.timezone, value: settings.timezone },
        { key: SETTING_KEYS.currency, value: settings.currency },
      ];
      await api.put('/settings/bulk', { settings: payload });
      if (i18n.language !== settings.locale) {
        await i18n.changeLanguage(settings.locale);
      }
      showToast(
        t('settings.general.saveSuccess', 'Settings saved successfully'),
      );
    } catch {
      showToast(
        t('settings.general.saveError', 'Failed to save settings'),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-400">{t('common.loading', 'Loading...')}</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-6">
        {t('settings.general.title', 'General Settings')}
      </h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="general-app-name"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.general.appName', 'App Name')}
          </label>
          <input
            id="general-app-name"
            type="text"
            value={settings.appName}
            onChange={(e) =>
              setSettings({ ...settings, appName: e.target.value })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="general-locale"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.general.locale', 'Language')}
          </label>
          <select
            id="general-locale"
            value={settings.locale}
            onChange={(e) =>
              setSettings({ ...settings, locale: e.target.value })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="cs">Čeština (CS)</option>
            <option value="en">English (EN)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="general-timezone"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.general.timezone', 'Timezone')}
          </label>
          <select
            id="general-timezone"
            value={settings.timezone}
            onChange={(e) =>
              setSettings({ ...settings, timezone: e.target.value })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="general-currency"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            {t('settings.general.currency', 'Currency')}
          </label>
          <select
            id="general-currency"
            value={settings.currency}
            onChange={(e) =>
              setSettings({ ...settings, currency: e.target.value })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
        >
          {saving
            ? t('common.saving', 'Saving...')
            : t('common.save', 'Save Settings')}
        </button>
      </form>
      {ToastComponent}
    </div>
  );
}
