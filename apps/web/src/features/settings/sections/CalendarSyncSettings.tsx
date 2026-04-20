import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';

interface SyncStatus {
  connected: boolean;
  lastSyncAt: string | null;
}

export function CalendarSyncSettings() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get<SyncStatus>('/calendar-sync/status');
      setStatus(res.data);
    } catch {
      setError('Failed to load sync status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    try {
      const res = await api.get<{ url: string }>('/calendar-sync/auth-url');
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 503) {
        setError('Google Calendar is not configured on this server');
      } else {
        setError('Failed to get authorization URL');
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await api.post<{ synced: number }>('/calendar-sync/sync');
      setError(null);
      await fetchStatus();
      alert(`Synced ${res.data.synced} tasks to Google Calendar`);
    } catch {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.delete('/calendar-sync/disconnect');
      setStatus({ connected: false, lastSyncAt: null });
    } catch {
      setError('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-medium text-gray-100 mb-4">
          Google Calendar
        </h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-100 mb-4">
        Google Calendar
      </h2>
      <p className="text-gray-400 mb-6">
        Sync tasks with due dates to your Google Calendar as events.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-gray-300">Connected</span>
          </div>

          {status.lastSyncAt && (
            <p className="text-sm text-gray-400">
              Last synced: {new Date(status.lastSyncAt).toLocaleString()}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Connect Google Calendar
        </button>
      )}
    </div>
  );
}
