import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';

export function TimeTrackingSettings() {
  const { showToast, ToastComponent } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({
    'timeTracking.autoStopHours': 8,
    'timeTracking.roundingMinutes': 1,
    'timeTracking.defaultWorkTypeId': '',
  });
  const [workTypes, setWorkTypes] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, workTypesRes] = await Promise.all([
          api.get('/settings'),
          api.get('/work-types')
        ]);
        
        const newSettings = { ...settings };
        settingsRes.data.forEach((s: any) => {
          if (s.key.startsWith('timeTracking.')) {
            newSettings[s.key] = s.value;
          }
        });
        
        setSettings(newSettings);
        setWorkTypes(workTypesRes.data.filter((w: any) => w.isActive !== false));
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
      <h2 className="text-xl font-medium text-gray-100 mb-6">Time Tracking Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Auto-stop tracking after (hours)</label>
          <input 
            type="number" 
            min="1"
            max="24"
            value={settings['timeTracking.autoStopHours']} 
            onChange={e => setSettings({...settings, 'timeTracking.autoStopHours': Number(e.target.value)})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Time Rounding</label>
          <select 
            value={settings['timeTracking.roundingMinutes']} 
            onChange={e => setSettings({...settings, 'timeTracking.roundingMinutes': Number(e.target.value)})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value={1}>1 minute (Exact)</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Default Work Type</label>
          <select 
            value={settings['timeTracking.defaultWorkTypeId'] || ''} 
            onChange={e => setSettings({...settings, 'timeTracking.defaultWorkTypeId': e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a default work type...</option>
            {workTypes.map(wt => (
              <option key={wt.id} value={wt.id}>{wt.name}</option>
            ))}
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
