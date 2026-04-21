import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth';
import type { FilterCondition } from './filter-builder.shared';

type SavedView = {
  id: string;
  name: string;
  entityType: string;
  config: {
    conditions?: FilterCondition[];
  };
};

type SavedViewsDropdownProps = {
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
};

const API_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/views`;

const areSameConditions = (left: FilterCondition[], right: FilterCondition[]) =>
  JSON.stringify(left) === JSON.stringify(right);

export const SavedViewsDropdown: React.FC<SavedViewsDropdownProps> = ({
  conditions,
  onChange,
}) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const fetchViews = useCallback(async () => {
    const token = localStorage.getItem('token') ?? accessToken;
    const response = await fetch(`${API_URL}?entityType=tasks`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to load saved views');
    }

    const payload = (await response.json()) as { data?: SavedView[] };
    setViews(payload.data ?? []);
  }, [accessToken]);

  useEffect(() => {
    fetchViews().catch((error) => {
      console.error(error);
    });
  }, [fetchViews]);

  useEffect(() => {
    const active = views.find((view) =>
      areSameConditions(view.config.conditions ?? [], conditions),
    );
    setActiveViewId(active?.id ?? null);
  }, [conditions, views]);

  const activeLabel = useMemo(
    () =>
      views.find((view) => view.id === activeViewId)?.name ?? 'Default View',
    [activeViewId, views],
  );

  const handleSave = async () => {
    const name = window.prompt('Save current view as:');
    if (!name) return;

    const token = localStorage.getItem('token') ?? accessToken;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name,
        entityType: 'tasks',
        config: { conditions },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save view');
    }

    await fetchViews();
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this saved view?')) return;
    const token = localStorage.getItem('token') ?? accessToken;
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to delete view');
    }

    await fetchViews();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
      >
        <Bookmark className="h-4 w-4 text-cyan-300" />
        {activeLabel}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-500 transition',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
              Saved views
            </p>
            <button
              type="button"
              onClick={() =>
                handleSave().catch((error) => console.error(error))
              }
              className="mt-3 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
            >
              Save current view
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {views.length === 0 ? (
              <div className="rounded-xl px-3 py-4 text-sm text-zinc-400">
                No saved views yet.
              </div>
            ) : (
              views.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(view.config.conditions ?? []);
                      setActiveViewId(view.id);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-zinc-100">
                      {view.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {(view.config.conditions ?? []).length} active rules
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(view.id).catch((error) =>
                        console.error(error),
                      )
                    }
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
