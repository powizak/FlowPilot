import { uuid } from '@flowpilot/shared';

export type FilterCondition = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

export const FIELD_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assigneeId', label: 'Assignee' },
  { value: 'dueDateBefore', label: 'Due before' },
  { value: 'dueDateAfter', label: 'Due after' },
] as const;

export const SELECT_OPTIONS: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  status: [
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  priority: [
    { value: 'none', label: 'None' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ],
};

export const getOperatorOptions = (field: string) =>
  field === 'dueDateBefore' || field === 'dueDateAfter'
    ? [
        {
          value: field === 'dueDateBefore' ? 'before' : 'after',
          label: field === 'dueDateBefore' ? 'Before' : 'After',
        },
      ]
    : [
        { value: 'is', label: 'Is' },
        { value: 'is_not', label: 'Is not' },
      ];

export const getDefaultOperator = (field: string) =>
  getOperatorOptions(field)[0]?.value ?? 'is';

export const createCondition = (
  field = 'status',
  value = '',
): FilterCondition => ({
  id: uuid(),
  field,
  operator: getDefaultOperator(field),
  value,
});

export const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfWeek = () => {
  const date = startOfToday();
  const day = date.getDay();
  const distance = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + distance);
  return date;
};

export const encodeFilters = (conditions: FilterCondition[]) => {
  const json = JSON.stringify(conditions);
  const bytes = new TextEncoder().encode(json);
  return btoa(String.fromCharCode(...bytes));
};

export const decodeFilters = (value: string | null) => {
  if (!value) return null;
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as FilterCondition[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
