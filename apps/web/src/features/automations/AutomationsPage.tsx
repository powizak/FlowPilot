import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Plus, Trash2, Zap, ZapOff } from 'lucide-react';

interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  isActive: boolean;
  trigger: { event: string; conditions?: Record<string, unknown> };
  actions: { type: string; params: Record<string, unknown> }[];
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_OPTIONS = [
  { value: 'task.status_changed', label: 'Task status changed' },
  { value: 'task.assigned', label: 'Task assigned' },
  { value: 'task.created', label: 'Task created' },
  { value: 'task.due_date_passed', label: 'Task due date passed' },
];

const ACTION_OPTIONS = [
  { value: 'assign_task', label: 'Assign task' },
  { value: 'change_status', label: 'Change status' },
  { value: 'add_comment', label: 'Add comment' },
  { value: 'send_notification', label: 'Send notification' },
];

const STATUS_OPTIONS = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'];

export function AutomationsPage({ projectId }: { projectId: string }) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/automations`);
      setRules(res.data.data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (id: string) => {
    await api.put(`/automations/${id}/toggle`);
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/automations/${id}`);
    fetchRules();
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        Loading automations…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-100">
          Automation Rules
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No automation rules yet.</p>
          <p className="text-sm mt-1">
            Create rules to automate task workflows.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(rule.id)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    rule.isActive
                      ? 'text-emerald-400 hover:bg-emerald-400/10'
                      : 'text-zinc-500 hover:bg-zinc-800',
                  )}
                  title={rule.isActive ? 'Disable' : 'Enable'}
                >
                  {rule.isActive ? (
                    <Zap className="h-4 w-4" />
                  ) : (
                    <ZapOff className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openEdit(rule)}
                    className="text-sm font-medium text-zinc-100 hover:text-blue-400 transition-colors truncate block"
                  >
                    {rule.name}
                  </button>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {TRIGGER_OPTIONS.find((t) => t.value === rule.trigger.event)
                      ?.label ?? rule.trigger.event}
                    {' → '}
                    {rule.actions
                      .map(
                        (a) =>
                          ACTION_OPTIONS.find((o) => o.value === a.type)
                            ?.label ?? a.type,
                      )
                      .join(', ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(rule.id)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RuleModal
          projectId={projectId}
          rule={editingRule}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchRules();
          }}
        />
      )}
    </div>
  );
}

function RuleModal({
  projectId,
  rule,
  onClose,
  onSaved,
}: {
  projectId: string;
  rule: AutomationRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(rule?.name ?? '');
  const [triggerEvent, setTriggerEvent] = useState(
    rule?.trigger.event ?? 'task.status_changed',
  );
  const [conditionKey, setConditionKey] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState(
    rule?.actions[0]?.type ?? 'assign_task',
  );
  const [actionParam, setActionParam] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      const conds = rule.trigger.conditions ?? {};
      const entries = Object.entries(conds);
      if (entries.length > 0) {
        setConditionKey(entries[0][0]);
        setConditionValue(String(entries[0][1]));
      }
      const firstAction = rule.actions[0];
      if (firstAction) {
        const paramEntries = Object.entries(firstAction.params);
        if (paramEntries.length > 0) {
          setActionParam(String(paramEntries[0][1]));
        }
      }
    }
  }, [rule]);

  const getActionParamLabel = (): string => {
    switch (actionType) {
      case 'assign_task':
        return 'User ID';
      case 'change_status':
        return 'Status';
      case 'add_comment':
        return 'Comment body';
      case 'send_notification':
        return 'User ID';
      default:
        return 'Value';
    }
  };

  const getActionParamKey = (): string => {
    switch (actionType) {
      case 'assign_task':
        return 'userId';
      case 'change_status':
        return 'status';
      case 'add_comment':
        return 'body';
      case 'send_notification':
        return 'userId';
      default:
        return 'value';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const trigger: Record<string, unknown> = { event: triggerEvent };
    if (conditionKey && conditionValue) {
      trigger.conditions = { [conditionKey]: conditionValue };
    }
    const actions = [
      { type: actionType, params: { [getActionParamKey()]: actionParam } },
    ];

    try {
      if (rule) {
        await api.put(`/automations/${rule.id}`, { name, trigger, actions });
      } else {
        await api.post(`/projects/${projectId}/automations`, {
          name,
          trigger,
          actions,
        });
      }
      onSaved();
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  };

  const showStatusSelect = actionType === 'change_status';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          {rule ? 'Edit Rule' : 'New Automation Rule'}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="rule-name"
              className="block text-sm text-zinc-400 mb-1"
            >
              Name
            </label>
            <input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Auto-assign reviewer on done"
            />
          </div>

          <div>
            <label
              htmlFor="rule-trigger"
              className="block text-sm text-zinc-400 mb-1"
            >
              When (Trigger)
            </label>
            <select
              id="rule-trigger"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="rule-cond-key"
                className="block text-sm text-zinc-400 mb-1"
              >
                Condition field
              </label>
              <input
                id="rule-cond-key"
                value={conditionKey}
                onChange={(e) => setConditionKey(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. to"
              />
            </div>
            <div>
              <label
                htmlFor="rule-cond-val"
                className="block text-sm text-zinc-400 mb-1"
              >
                Condition value
              </label>
              <input
                id="rule-cond-val"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. done"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="rule-action"
              className="block text-sm text-zinc-400 mb-1"
            >
              Then (Action)
            </label>
            <select
              id="rule-action"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rule-action-param"
              className="block text-sm text-zinc-400 mb-1"
            >
              {getActionParamLabel()}
            </label>
            {showStatusSelect ? (
              <select
                id="rule-action-param"
                value={actionParam}
                onChange={(e) => setActionParam(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="rule-action-param"
                value={actionParam}
                onChange={(e) => setActionParam(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={getActionParamLabel()}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            {saving ? 'Saving…' : rule ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
