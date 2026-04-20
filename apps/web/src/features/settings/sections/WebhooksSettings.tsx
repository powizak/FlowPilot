import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';

interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  attemptCount: number;
  deliveredAt: string | null;
  createdAt: string;
}

const EVENT_OPTIONS = [
  'task.created',
  'task.updated',
  'invoice.sent',
  'invoice.paid',
];

export function WebhooksSettings() {
  const { showToast, ToastComponent } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Webhook> | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [deliveryWebhookId, setDeliveryWebhookId] = useState<string | null>(
    null,
  );

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data } = await api.get('/webhooks');
      setWebhooks(data.data);
    } catch {
      showToast('Failed to load webhooks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleSave = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        await api.put(`/webhooks/${editing.id}`, {
          url: editing.url,
          events: editing.events,
          isActive: editing.isActive,
          ...(editing.secret && !editing.secret.includes('****')
            ? { secret: editing.secret }
            : {}),
        });
        showToast('Webhook updated');
      } else {
        await api.post('/webhooks', {
          url: editing.url,
          events: editing.events,
          isActive: editing.isActive ?? true,
        });
        showToast('Webhook created');
      }
      setEditing(null);
      fetchWebhooks();
    } catch {
      showToast('Failed to save webhook', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`);
      showToast('Webhook deleted');
      fetchWebhooks();
    } catch {
      showToast('Failed to delete webhook', 'error');
    }
  };

  const showDeliveries = async (webhookId: string) => {
    try {
      const { data } = await api.get(`/webhooks/${webhookId}/deliveries`);
      setDeliveries(data.data);
      setDeliveryWebhookId(webhookId);
    } catch {
      showToast('Failed to load deliveries', 'error');
    }
  };

  const toggleEvent = (event: string) => {
    if (!editing) return;
    const events = editing.events ?? [];
    setEditing({
      ...editing,
      events: events.includes(event)
        ? events.filter((e) => e !== event)
        : [...events, event],
    });
  };

  if (loading) {
    return <p className="text-gray-400">Loading webhooks...</p>;
  }

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-100">Webhooks</h2>
        <button
          type="button"
          onClick={() => setEditing({ url: '', events: [], isActive: true })}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Webhook
        </button>
      </div>

      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400">
            <th className="pb-2">URL</th>
            <th className="pb-2">Events</th>
            <th className="pb-2">Active</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((wh) => (
            <tr key={wh.id} className="border-b border-gray-700/50">
              <td className="py-2 text-gray-200 max-w-[200px] truncate">
                {wh.url}
              </td>
              <td className="py-2 text-gray-300">
                {(wh.events as string[]).join(', ')}
              </td>
              <td className="py-2">
                <span
                  className={wh.isActive ? 'text-green-400' : 'text-gray-500'}
                >
                  {wh.isActive ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="py-2 space-x-2">
                <button
                  type="button"
                  onClick={() => setEditing(wh)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => showDeliveries(wh.id)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Deliveries
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(wh.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {webhooks.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-gray-500 text-center">
                No webhooks configured
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-100 mb-4">
              {editing.id ? 'Edit Webhook' : 'Add Webhook'}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="wh-url"
                  className="block text-sm text-gray-400 mb-1"
                >
                  URL
                </label>
                <input
                  id="wh-url"
                  type="url"
                  value={editing.url ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm"
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <span className="block text-sm text-gray-400 mb-1">Events</span>
                <div className="space-y-1">
                  {EVENT_OPTIONS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={editing.events?.includes(event) ?? false}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-600"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.isActive ?? true}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className="rounded border-gray-600"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deliveries && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-100">
                Delivery History
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDeliveries(null);
                  setDeliveryWebhookId(null);
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="pb-2">Event</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Attempts</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b border-gray-700/50">
                    <td className="py-2 text-gray-200">{d.event}</td>
                    <td className="py-2">
                      <span
                        className={
                          d.deliveredAt
                            ? 'text-green-400'
                            : d.statusCode
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }
                      >
                        {d.statusCode ?? 'pending'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-300">{d.attemptCount}</td>
                    <td className="py-2 text-gray-400">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500 text-center">
                      No deliveries yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
