// Date-key utilities. A "date key" is a YYYY-MM-DD string anchored to the
// user's local calendar, not a moment in time. Functions here are pure string
// math — no timezone semantics leak in or out. The only place timezones come
// into play is when converting an actual `Date` (a moment) into a key; for
// that, use `getLocalDateKey` from `lib/timezone.ts`.

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export function parseDateKey(key: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function formatDateKey(
  year: number,
  month: number,
  day: number,
): string {
  return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Add N days (may be negative) to a YYYY-MM-DD key. Uses UTC Date math
// internally purely as a calendar calculator — no timezone semantics escape.
export function addDays(key: string, delta: number): string {
  const { year, month, day } = parseDateKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return formatDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

// 0 = Sunday .. 6 = Saturday (JS Date convention).
export function weekdayIndexOf(key: string): number {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// Short human label like "Mon 7" — used by the backfill chip UI.
export function labelFor(key: string): string {
  const { day } = parseDateKey(key);
  return `${WEEKDAY_SHORT[weekdayIndexOf(key)]} ${day}`;
}
