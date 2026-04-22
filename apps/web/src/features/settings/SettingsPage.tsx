import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth';
import { GeneralSettings } from './sections/GeneralSettings';
import { WorkTypesSettings } from './sections/WorkTypesSettings';
import { TimeTrackingSettings } from './sections/TimeTrackingSettings';
import { InvoiceSettings } from './sections/InvoiceSettings';
import { BankAccountsSettings } from './sections/BankAccountsSettings';
import { UserProfileSettings } from './sections/UserProfileSettings';
import { AISettings } from './sections/AISettings';
import { WebhooksSettings } from './sections/WebhooksSettings';
import { CalendarSyncSettings } from './sections/CalendarSyncSettings';

export function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'general' : 'profile');

  const adminTabs = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI Settings' },
    { id: 'workTypes', label: 'Work Types' },
    { id: 'projectDefaults', label: 'Project Defaults' },
    { id: 'timeTracking', label: 'Time Tracking' },
    { id: 'invoice', label: 'Invoice' },
    { id: 'bankAccounts', label: 'Bank Accounts' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const tabs = [
    ...(isAdmin ? adminTabs : []),
    { id: 'profile', label: 'User Profile' },
    { id: 'calendar', label: 'Google Calendar' },
  ];

  return (
    <div className="flex h-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="w-64 shrink-0 pr-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">Settings</h1>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 max-w-3xl">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {activeTab === 'general' && isAdmin && <GeneralSettings />}
          {activeTab === 'ai' && isAdmin && <AISettings />}
          {activeTab === 'workTypes' && isAdmin && <WorkTypesSettings />}
          {activeTab === 'projectDefaults' && isAdmin && (
            <div>
              <h2 className="text-xl font-medium text-gray-100 mb-4">
                Project Defaults
              </h2>
              <p className="text-gray-400">
                Project default settings coming soon.
              </p>
            </div>
          )}
          {activeTab === 'timeTracking' && isAdmin && <TimeTrackingSettings />}
          {activeTab === 'invoice' && isAdmin && <InvoiceSettings />}
          {activeTab === 'bankAccounts' && isAdmin && <BankAccountsSettings />}
          {activeTab === 'webhooks' && isAdmin && <WebhooksSettings />}
          {activeTab === 'notifications' && isAdmin && (
            <div>
              <h2 className="text-xl font-medium text-gray-100 mb-4">
                Notifications
              </h2>
              <p className="text-gray-400">
                Notification settings coming soon.
              </p>
            </div>
          )}
          {activeTab === 'profile' && <UserProfileSettings />}
          {activeTab === 'calendar' && <CalendarSyncSettings />}
        </div>
      </div>
    </div>
  );
}
