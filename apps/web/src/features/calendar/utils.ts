export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getStartDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export function formatISODate(date: Date) {
  return date.toISOString().split('T')[0];
}

export function getMonthGrid(year: number, month: number) {
  // Returns a 6x7 grid (42 days) starting from the Monday of the first week of the month
  const daysInMonth = getDaysInMonth(year, month);
  let startDay = getStartDayOfMonth(year, month) - 1; // shift to 0 = Mon, 6 = Sun
  if (startDay === -1) startDay = 6;

  const prevMonthDays = getDaysInMonth(year, month - 1);
  const grid: { date: Date; isCurrentMonth: boolean; isoString: string }[] = [];

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    grid.push({ date: d, isCurrentMonth: false, isoString: formatISODate(d) });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    grid.push({ date: d, isCurrentMonth: true, isoString: formatISODate(d) });
  }

  // Next month days to complete 42
  let nextMonthDay = 1;
  while (grid.length < 42) {
    const d = new Date(year, month + 1, nextMonthDay++);
    grid.push({ date: d, isCurrentMonth: false, isoString: formatISODate(d) });
  }

  return grid;
}

export function getWeekDays(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(date.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    week.push({ date: d, isoString: formatISODate(d) });
  }
  return week;
}

export function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

const colors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 
  'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500'
];

export function getProjectColor(projectId: string) {
  if (!projectId) return 'bg-gray-500';
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
