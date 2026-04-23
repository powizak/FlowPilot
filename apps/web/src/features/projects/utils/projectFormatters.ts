export const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('cs-CZ');
};

export const formatCurrency = (amount: number | null, currency: string) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency || 'CZK',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/20 text-gray-400',
  on_hold: 'bg-yellow-500/20 text-yellow-400',
};
