export function parseDateBoundary(value: string | undefined, boundary: 'start' | 'end'): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return boundary === 'start'
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(`${value}T23:59:59.999Z`);
  }

  return new Date(value);
}

export function ensureValidRange(startedAt: Date, endedAt: Date): void {
  if (endedAt.getTime() <= startedAt.getTime()) {
    throw new RangeError('endedAt must be after startedAt');
  }
}

export function calculateDurationMinutes(startedAt: Date, endedAt: Date): number {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000));
}

export function applyDurationRounding(minutes: number, roundingMinutes: number): number {
  if (!Number.isFinite(roundingMinutes) || roundingMinutes <= 0) {
    return minutes;
  }

  return Math.round(minutes / roundingMinutes) * roundingMinutes;
}

export function splitRangeAtMidnight(startedAt: Date, endedAt: Date): Array<{ startedAt: Date; endedAt: Date }> {
  const segments: Array<{ startedAt: Date; endedAt: Date }> = [];
  let cursor = startedAt;

  while (!isSameUtcDay(cursor, endedAt)) {
    const endOfDay = new Date(Date.UTC(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate(),
      23,
      59,
      59,
      999,
    ));
    segments.push({ startedAt: cursor, endedAt: endOfDay });
    cursor = new Date(endOfDay.getTime() + 1);
  }

  segments.push({ startedAt: cursor, endedAt });
  return segments;
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return left.getUTCFullYear() === right.getUTCFullYear()
    && left.getUTCMonth() === right.getUTCMonth()
    && left.getUTCDate() === right.getUTCDate();
}
