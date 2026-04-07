import type { Task, TaskLog } from "@prisma/client";
import {
  endOfDayInTimezone,
  getLocalDateKey,
  getTimePartsInTimezone,
  normalizeTimezone,
  startOfDayInTimezone,
} from "@/lib/timezone";

export const BUCKETS = ["MORNING", "DAY", "EVENING", "BEFORE_BED"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  MORNING: "Morning",
  DAY: "Day",
  EVENING: "Evening",
  BEFORE_BED: "Before Bed",
};

// Monday, 2024-01-01, midnight UTC — used as a deterministic fortnight anchor.
export const FORTNIGHT_EPOCH = new Date("2024-01-01T00:00:00.000Z");
const MS_PER_DAY = 86_400_000;
export const WEEKDAY_ORDER = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const;
export type Weekday = (typeof WEEKDAY_ORDER)[number];

export interface BucketPrefs {
  bucketMorningStart: number;
  bucketDayStart: number;
  bucketEveningStart: number;
  bucketBeforeBedStart: number;
}

export function getPeriodRange(
  frequency: string,
  now: Date = new Date(),
  timezone = "UTC",
): { start: Date; end: Date } {
  const zone = normalizeTimezone(timezone);
  if (frequency === "DAILY") {
    const start = startOfDayInTimezone(now, zone);
    const end = endOfDayInTimezone(now, zone);
    return { start, end };
  }

  if (frequency === "WEEKLY") {
    // Monday-based week
    const day = getTimePartsInTimezone(now, zone).weekdayIndex; // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day;
    const start = startOfDayInTimezone(
      new Date(now.getTime() + diff * MS_PER_DAY),
      zone,
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
    return { start, end };
  }

  if (frequency === "FORTNIGHTLY") {
    const startOfToday = startOfDayInTimezone(now, zone);
    const daysSinceEpoch = Math.floor(
      (startOfToday.getTime() - FORTNIGHT_EPOCH.getTime()) / MS_PER_DAY,
    );
    const fortnightIndex = Math.floor(daysSinceEpoch / 14);
    const start = new Date(
      FORTNIGHT_EPOCH.getTime() + fortnightIndex * 14 * MS_PER_DAY,
    );
    const end = new Date(start.getTime() + 14 * MS_PER_DAY - 1);
    return { start, end };
  }

  // MONTHLY
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

export function logsInPeriod(
  logs: TaskLog[],
  frequency: string,
  now: Date = new Date(),
  timezone = "UTC",
): number {
  const { start, end } = getPeriodRange(frequency, now, timezone);
  return logs.filter((l) => {
    const d = new Date(l.completedAt);
    return d >= start && d <= end;
  }).length;
}

export function periodLengthDays(frequency: string): number {
  if (frequency === "DAILY") return 1;
  if (frequency === "WEEKLY") return 7;
  if (frequency === "FORTNIGHTLY") return 14;
  // MONTHLY — use current month length
  const { start, end } = getPeriodRange("MONTHLY");
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function autoGapDays(
  task: Pick<Task, "frequency" | "frequencyValue">,
): number {
  const len = periodLengthDays(task.frequency);
  const fv = Math.max(1, task.frequencyValue);
  return Math.max(1, Math.floor(len / fv));
}

export function effectiveGapDays(
  task: Pick<Task, "frequency" | "frequencyValue" | "minGapDays">,
): number {
  if (task.minGapDays != null) return task.minGapDays;
  if (task.frequencyValue <= 1) return 0;
  return autoGapDays(task);
}

type TaskWithLogs = Task & { logs: TaskLog[] };

export function parseScheduledWeekdays(value: string | null): Weekday[] | null {
  if (!value) return null;
  const parsed = value
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part): part is Weekday => WEEKDAY_ORDER.includes(part as Weekday));
  if (parsed.length === 0) return null;
  return [...new Set(parsed)];
}

export function serializeScheduledWeekdays(
  weekdays?: Weekday[],
): string | null {
  if (!weekdays || weekdays.length === 0 || weekdays.length === 7) return null;
  const selected = new Set<Weekday>(weekdays);
  return WEEKDAY_ORDER.filter((day) => selected.has(day)).join(",");
}

export function isScheduledForToday(
  task: Pick<Task, "scheduledWeekdays">,
  now: Date = new Date(),
  timezone = "UTC",
): boolean {
  const scheduled = parseScheduledWeekdays(task.scheduledWeekdays);
  if (!scheduled) return true;
  const weekdayIndex = getTimePartsInTimezone(now, timezone).weekdayIndex;
  const today = WEEKDAY_ORDER[weekdayIndex];
  return scheduled.includes(today);
}

function latestLogDate(logs: TaskLog[]): Date | null {
  if (logs.length === 0) return null;
  let latest = new Date(logs[0].completedAt);
  for (const l of logs) {
    const d = new Date(l.completedAt);
    if (d > latest) latest = d;
  }
  return latest;
}

export function isLogicallyDue(
  task: TaskWithLogs,
  now: Date = new Date(),
  timezone = "UTC",
): boolean {
  if (!isScheduledForToday(task, now, timezone)) return false;
  const { start, end } = getPeriodRange(task.frequency, now, timezone);
  const count = task.logs.filter((l) => {
    const d = new Date(l.completedAt);
    return d >= start && d <= end;
  }).length;
  if (count >= task.frequencyValue) return false;
  const gap = effectiveGapDays(task);
  if (gap <= 0) return true;
  const last = latestLogDate(task.logs);
  if (!last) return true;
  const nextAllowed = new Date(last.getTime() + gap * MS_PER_DAY);
  return now >= nextAllowed;
}

// Back-compat alias.
export function isDue(task: TaskWithLogs): boolean {
  return isLogicallyDue(task);
}

export function nextDueAt(
  task: TaskWithLogs,
  now: Date = new Date(),
  timezone = "UTC",
): Date | null {
  if (isLogicallyDue(task, now, timezone)) return null;
  const { start, end } = getPeriodRange(task.frequency, now, timezone);
  const count = task.logs.filter((l) => {
    const d = new Date(l.completedAt);
    return d >= start && d <= end;
  }).length;
  // Gated by period cap → next period start
  if (count >= task.frequencyValue) {
    return new Date(end.getTime() + 1);
  }
  // Gated by spacing
  const gap = effectiveGapDays(task);
  const last = latestLogDate(task.logs);
  if (!last || gap <= 0) return null;
  return new Date(last.getTime() + gap * MS_PER_DAY);
}

export function getCurrentBucket(
  prefs: BucketPrefs,
  now: Date = new Date(),
  timezone = "UTC",
): Bucket {
  const local = getTimePartsInTimezone(now, timezone);
  const hour = local.hour + local.minute / 60;
  const rawEntries: { b: Bucket; s: number }[] = [
    { b: "MORNING", s: prefs.bucketMorningStart },
    { b: "DAY", s: prefs.bucketDayStart },
    { b: "EVENING", s: prefs.bucketEveningStart },
    { b: "BEFORE_BED", s: prefs.bucketBeforeBedStart },
  ];
  const entries = rawEntries.sort((a, b) => a.s - b.s);

  // Pre-dawn wrap: if hour is before the earliest start, we're in the last bucket
  // (the bucket whose window crosses midnight — typically Before Bed).
  let current: Bucket = entries[entries.length - 1].b;
  for (const e of entries) {
    if (e.s <= hour) current = e.b;
  }
  return current;
}

export function bucketOrderFromNow(
  prefs: BucketPrefs,
  now: Date = new Date(),
  timezone = "UTC",
): Bucket[] {
  const current = getCurrentBucket(prefs, now, timezone);
  const idx = BUCKETS.indexOf(current);
  return [...BUCKETS.slice(idx), ...BUCKETS.slice(0, idx)];
}

export function isReminderDue(
  task: Task & { logs?: TaskLog[] },
  now: Date = new Date(),
  timezone = "UTC",
): boolean {
  if (!task.reminderEnabled || !task.reminderTime) return false;
  if (!isScheduledForToday(task, now, timezone)) return false;

  // If caller passed logs, gate on logical due state so we don't nag for done tasks.
  if (task.logs) {
    if (!isLogicallyDue(task as TaskWithLogs, now, timezone)) return false;
  }

  const [hStr, mStr] = task.reminderTime.split(":");
  const reminderHour = Number(hStr);
  const reminderMin = Number(mStr);

  const local = getTimePartsInTimezone(now, timezone);
  const currentMinutes = local.hour * 60 + local.minute;
  const reminderMinutes = reminderHour * 60 + reminderMin;
  return currentMinutes >= reminderMinutes;
}

export function isSameLocalDay(a: Date, b: Date, timezone = "UTC"): boolean {
  return getLocalDateKey(a, timezone) === getLocalDateKey(b, timezone);
}

export function frequencyLabel(
  frequency: string,
  frequencyValue: number,
): string {
  const unit =
    frequency === "DAILY"
      ? "day"
      : frequency === "WEEKLY"
        ? "week"
        : frequency === "FORTNIGHTLY"
          ? "fortnight"
          : "month";
  return `${frequencyValue}× per ${unit}`;
}
