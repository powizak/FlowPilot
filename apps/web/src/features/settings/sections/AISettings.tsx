import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProviderCard } from './ai/ProviderCard';
import { BudgetSection } from './ai/BudgetSection';
import { SkillsSection } from './ai/SkillsSection';
import { api } from '../../../lib/api';

export function AISettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        const aiSettings = data.reduce(
          (acc: Record<string, string>, s: { key: string; value: unknown }) => {
            if (s.key.startsWith('ai.')) {
              acc[s.key] = String(s.value ?? '');
            }
            return acc;
          },
          {},
        );
        setSettings(aiSettings);
      } catch {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/settings/${key}`, { value });
        showToast('Setting saved successfully', 'success');
      } catch {
        showToast('Failed to save setting', 'error');
      }
    }, 500);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-6">AI Settings</h2>

      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-gray-400 mb-2">
          Preferred Provider
        </legend>
        <div className="flex space-x-4">
          {['openai', 'gemini', 'openrouter'].map((provider) => (
            <label
              key={provider}
              htmlFor={`ai-provider-${provider}`}
              className="flex items-center space-x-2 text-gray-200 cursor-pointer"
            >
              <input
                id={`ai-provider-${provider}`}
                type="radio"
                name="preferredProvider"
                value={provider}
                checked={settings['ai.preferredProvider'] === provider}
                onChange={(e) =>
                  handleSettingChange('ai.preferredProvider', e.target.value)
                }
                className="text-blue-500 focus:ring-blue-500 bg-gray-900 border-gray-700"
              />
              <span className="capitalize">
                {provider === 'openai'
                  ? 'OpenAI'
                  : provider === 'gemini'
                    ? 'Gemini'
                    : 'OpenRouter'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ProviderCard
          provider="openai"
          title="OpenAI"
          models={['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']}
          settings={settings}
          onSettingChange={handleSettingChange}
          showToast={showToast}
        />
        <ProviderCard
          provider="gemini"
          title="Google Gemini"
          models={['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']}
          settings={settings}
          onSettingChange={handleSettingChange}
          showToast={showToast}
        />
        <ProviderCard
          provider="openrouter"
          title="OpenRouter"
          models={[
            'mistralai/mixtral-8x7b-instruct',
            'anthropic/claude-3-haiku',
            'openai/gpt-4o',
          ]}
          settings={settings}
          onSettingChange={handleSettingChange}
          showToast={showToast}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <BudgetSection
          settings={settings}
          onSettingChange={handleSettingChange}
        />
        <SkillsSection />
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded shadow-lg text-white z-50 transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
