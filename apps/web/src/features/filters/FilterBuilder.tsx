import React, { useEffect, useMemo, useRef } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import {
  createCondition,
  decodeFilters,
  endOfWeek,
  formatDate,
  getDefaultOperator,
  startOfToday,
  type FilterCondition,
  encodeFilters,
} from './filter-builder.shared';
import { FilterBuilderRow } from './FilterBuilderRow';

type FilterBuilderProps = {
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  conditions,
  onChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const encodedConditions = useMemo(
    () => encodeFilters(conditions),
    [conditions],
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const parsed = decodeFilters(searchParams.get('filters'));
    if (parsed && JSON.stringify(parsed) !== JSON.stringify(conditions)) {
      onChange(parsed);
    }
  }, [conditions, onChange, searchParams]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const next = new URLSearchParams(searchParams);
    if (conditions.length === 0) {
      next.delete('filters');
    } else if (searchParams.get('filters') !== encodedConditions) {
      next.set('filters', encodedConditions);
    } else {
      return;
    }
    setSearchParams(next, { replace: true });
  }, [conditions, encodedConditions, searchParams, setSearchParams]);

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(
      conditions.map((condition) => {
        if (condition.id !== id) return condition;
        const nextField = updates.field ?? condition.field;
        return {
          ...condition,
          ...updates,
          field: nextField,
          operator: updates.field
            ? getDefaultOperator(nextField)
            : (updates.operator ?? condition.operator),
          value: updates.field ? '' : (updates.value ?? condition.value),
        };
      }),
    );
  };

  const applyPreset = (preset: 'mine' | 'overdue' | 'week' | 'unassigned') => {
    const today = formatDate(startOfToday());
    const nextConditions = {
      mine: user?.id ? [createCondition('assigneeId', user.id)] : [],
      overdue: [
        createCondition('dueDateBefore', today),
        { ...createCondition('status', 'done'), operator: 'is_not' },
      ],
      week: [
        createCondition('dueDateAfter', today),
        createCondition('dueDateBefore', formatDate(endOfWeek())),
      ],
      unassigned: [createCondition('assigneeId', '')],
    }[preset];
    onChange(nextConditions);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(145deg,rgba(17,24,39,0.9),rgba(9,12,18,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/70">
              Advanced filters
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">
              Build precision task slices
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onChange([...conditions, createCondition()])}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
          >
            <Plus className="h-4 w-4" />
            Add filter
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[
            ['mine', 'My Tasks'],
            ['overdue', 'Overdue'],
            ['week', 'Due This Week'],
            ['unassigned', 'Unassigned'],
          ].map(([preset, label]) => (
            <button
              key={preset}
              type="button"
              onClick={() =>
                applyPreset(
                  preset as 'mine' | 'overdue' | 'week' | 'unassigned',
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {label}
            </button>
          ))}
          {conditions.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {conditions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-6 text-sm text-zinc-400">
            No advanced filters yet. Start with a preset or add a custom rule.
          </div>
        ) : (
          conditions.map((condition) => (
            <FilterBuilderRow
              key={condition.id}
              condition={condition}
              onUpdate={updateCondition}
              onRemove={(id) =>
                onChange(conditions.filter((item) => item.id !== id))
              }
            />
          ))
        )}
      </div>
    </section>
  );
};
