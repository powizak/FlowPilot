import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../../../lib/api';

export interface ProviderCardProps {
  provider: 'openai' | 'gemini' | 'openRouter';
  title: string;
  models: string[];
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ProviderCard({ provider, title, models, settings, onSettingChange, showToast }: ProviderCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const enabledKey = `ai.${provider}.enabled`;
  const apiKeyKey = `ai.${provider}.apiKey`;
  const modelKey = `ai.${provider}.model`;

  const isEnabled = settings[enabledKey] === 'true' || settings[enabledKey] === true;
  const apiKey = settings[apiKeyKey] || '';
  const currentModel = settings[modelKey] || models[0];

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // we need to temporarily save the current key/model if we want to test with them, 
      // but assuming the backend uses the saved ones, we might just call the test endpoint
      // actually, the instructions say:
      // "Test Connection" button -> POST /api/ai/run-skill with { skillName: "echo", input: "test" }
      // This tests whatever is currently configured on the backend.
      await api.post('/ai/run-skill', { skillName: 'echo', input: 'test' });
      setTestResult('success');
      showToast(`${title} connection successful`);
    } catch {
      setTestResult('error');
      showToast(`${title} connection failed`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-100">{title}</h3>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isEnabled}
              onChange={(e) => onSettingChange(enabledKey, e.target.checked.toString())}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm text-gray-300">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onSettingChange(apiKeyKey, e.target.value)}
              placeholder="Enter API Key"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 pr-10 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-200"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
          <select
            value={currentModel}
            onChange={(e) => onSettingChange(modelKey, e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center pt-2 gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !isEnabled}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 text-sm font-medium rounded border border-gray-600 transition-colors"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult === 'success' && <CheckCircle2 size={18} className="text-green-500" />}
          {testResult === 'error' && <XCircle size={18} className="text-red-500" />}
        </div>
      </div>
    </div>
  );
}
