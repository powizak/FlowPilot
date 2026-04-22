import React, { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

export interface BudgetSectionProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function BudgetSection({
  settings,
  onSettingChange,
}: BudgetSectionProps) {
  const [usage, setUsage] = useState({
    tokensUsed: 0,
    budget: 0,
    resetDate: '',
  });

  useEffect(() => {
    api
      .get('/ai/usage')
      .then((res) => setUsage(res.data))
      .catch(() => {});
  }, []);

  const budgetTokens = settings['ai.monthlyBudgetTokens'] || '';
  const tokensUsed = usage.tokensUsed || 0;
  const budget = parseInt(budgetTokens) || usage.budget || 1;
  const percentage = Math.min(100, Math.round((tokensUsed / budget) * 100));

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
      <h3 className="text-lg font-medium text-gray-100 mb-4">Budget & Usage</h3>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="ai-monthly-token-budget"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Monthly Token Budget
          </label>
          <input
            id="ai-monthly-token-budget"
            type="number"
            value={budgetTokens}
            onChange={(e) =>
              onSettingChange('ai.monthlyBudgetTokens', e.target.value)
            }
            className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. 1000000"
          />
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Tokens Used: {tokensUsed.toLocaleString()}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          {usage.resetDate && (
            <p className="text-xs text-gray-500 mt-2">
              Resets on: {new Date(usage.resetDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
