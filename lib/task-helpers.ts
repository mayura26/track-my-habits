import type { Task, TaskLog } from "@prisma/client";

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
): { start: Date; end: Date } {
  if (frequency === "DAILY") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (frequency === "WEEKLY") {
    // Monday-based week
    const start = new Date(now);
    const day = start.getDay(); // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (frequency === "FORTNIGHTLY") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
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

export function logsInPeriod(logs: TaskLog[], frequency: string): number {
  const { start, end } = getPeriodRange(frequency);
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
): boolean {
  const scheduled = parseScheduledWeekdays(task.scheduledWeekdays);
  if (!scheduled) return true;
  const today = WEEKDAY_ORDER[now.getDay()];
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
): boolean {
  if (!isScheduledForToday(task, now)) return false;
  const count = logsInPeriod(task.logs, task.frequency);
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
): Date | null {
  if (isLogicallyDue(task, now)) return null;
  const count = logsInPeriod(task.logs, task.frequency);
  // Gated by period cap → next period start
  if (count >= task.frequencyValue) {
    const { end } = getPeriodRange(task.frequency);
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
): Bucket {
  const hour = now.getHours() + now.getMinutes() / 60;
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
): Bucket[] {
  const current = getCurrentBucket(prefs, now);
  const idx = BUCKETS.indexOf(current);
  return [...BUCKETS.slice(idx), ...BUCKETS.slice(0, idx)];
}

export function isReminderDue(
  task: Task & { logs?: TaskLog[] },
  now: Date = new Date(),
): boolean {
  if (!task.reminderEnabled || !task.reminderTime) return false;
  if (!isScheduledForToday(task, now)) return false;

  // If caller passed logs, gate on logical due state so we don't nag for done tasks.
  if (task.logs) {
    if (!isLogicallyDue(task as TaskWithLogs, now)) return false;
  }

  const [hStr, mStr] = task.reminderTime.split(":");
  const reminderHour = Number(hStr);
  const reminderMin = Number(mStr);

  const reminderDate = new Date(now);
  reminderDate.setHours(reminderHour, reminderMin, 0, 0);

  return now >= reminderDate;
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
