import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return { 
    toast, 
    showToast, 
    ToastComponent: toast ? (
      <div className={`fixed bottom-4 right-4 p-4 rounded shadow-lg text-white z-50 transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
        {toast.message}
      </div>
    ) : null 
  };
}

export function GeneralSettings() {
  const { showToast, ToastComponent } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({
    appName: '',
    locale: 'en',
    timezone: 'UTC',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        const newSettings = { ...settings };
        data.forEach((s: any) => {
          if (['appName', 'locale', 'timezone', 'currency'].includes(s.key)) {
            newSettings[s.key] = s.value;
          }
        });
        setSettings(newSettings);
      } catch (e) {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all(
        Object.entries(settings).map(([key, value]) => 
          api.put(`/settings/${key}`, { value })
        )
      );
      showToast('Settings saved successfully');
    } catch (e) {
      showToast('Failed to save settings', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-6">General Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">App Name</label>
          <input 
            type="text" 
            value={settings.appName || ''} 
            onChange={e => setSettings({...settings, appName: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Locale</label>
          <select 
            value={settings.locale || 'en'} 
            onChange={e => setSettings({...settings, locale: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="en">English (EN)</option>
            <option value="cs">Czech (CS)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Timezone</label>
          <input 
            type="text" 
            value={settings.timezone || ''} 
            onChange={e => setSettings({...settings, timezone: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
          <select 
            value={settings.currency || 'USD'} 
            onChange={e => setSettings({...settings, currency: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CZK">CZK</option>
          </select>
        </div>
        <button type="submit" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
          Save Settings
        </button>
      </form>
      {ToastComponent}
    </div>
  );
}
