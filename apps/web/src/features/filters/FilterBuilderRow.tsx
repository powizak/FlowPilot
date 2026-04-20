import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  FIELD_OPTIONS,
  getOperatorOptions,
  SELECT_OPTIONS,
  type FilterCondition,
} from './filter-builder.shared';

type FilterBuilderRowProps = {
  condition: FilterCondition;
  onUpdate: (id: string, updates: Partial<FilterCondition>) => void;
  onRemove: (id: string) => void;
};

export const FilterBuilderRow: React.FC<FilterBuilderRowProps> = ({
  condition,
  onUpdate,
  onRemove,
}) => {
  const options = getOperatorOptions(condition.field);
  const valueOptions = SELECT_OPTIONS[condition.field];
  const inputType = condition.field.startsWith('dueDate') ? 'date' : 'text';

  return (
    <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 md:grid-cols-[1.15fr_0.8fr_1fr_auto] md:items-center">
      <select
        value={condition.field}
        onChange={(event) =>
          onUpdate(condition.id, { field: event.target.value })
        }
        className={cn(
          'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition',
          'focus:border-cyan-300/40 focus:bg-white/8',
        )}
      >
        {FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(event) =>
          onUpdate(condition.id, { operator: event.target.value })
        }
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {valueOptions ? (
        <select
          value={condition.value}
          onChange={(event) =>
            onUpdate(condition.id, { value: event.target.value })
          }
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
        >
          <option value="">Select value</option>
          {valueOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={inputType}
          value={condition.value}
          onChange={(event) =>
            onUpdate(condition.id, { value: event.target.value })
          }
          placeholder={
            condition.field === 'assigneeId'
              ? 'User ID or leave empty'
              : 'Enter value'
          }
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/40 focus:bg-white/8"
        />
      )}

      <button
        type="button"
        onClick={() => onRemove(condition.id)}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
