import type { Habit } from "@prisma/client";
import { getLocalDateKey, zonedDateTimeToUtc } from "@/lib/timezone";

export const TIME_DEADLINE_TRACKING_TYPE = "TIME_DEADLINE";

const MINUTES_PER_DAY = 24 * 60;

export type DeadlineDayStatus =
  | "pending"
  | "completed"
  | "failed"
  | "late-failed";

export interface DeadlineEvaluation {
  status: DeadlineDayStatus;
  cutoffAt: Date | null;
  deadlineAt: Date | null;
  reminderAt: Date | null;
  dateKey: string;
}

type DeadlineHabit = Pick<
  Habit,
  | "trackingType"
  | "deadlineTime"
  | "deadlineGraceMinutes"
  | "reminderLeadMinutes"
  | "scheduledWeekdays"
>;

type DeadlineLog = { loggedAt: Date | string; status: string };

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function minutesToTimeParts(totalMinutes: number) {
  const normalized =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

function addDaysToDateParts(
  year: number,
  month: number,
  day: number,
  dayOffset: number,
) {
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function getDeadlineCutoffForDateKey(
  habit: Pick<Habit, "deadlineTime" | "deadlineGraceMinutes">,
  dateKey: string,
  timezone: string,
): Date | null {
  const deadlineMinutes = parseTimeToMinutes(habit.deadlineTime);
  if (deadlineMinutes == null) return null;
  const base = parseDateKey(dateKey);
  const grace = Math.max(0, habit.deadlineGraceMinutes ?? 0);
  const cutoffMinutes = deadlineMinutes + grace;
  const dayOffset = Math.floor(cutoffMinutes / MINUTES_PER_DAY);
  const parts = addDaysToDateParts(base.year, base.month, base.day, dayOffset);
  const time = minutesToTimeParts(cutoffMinutes);
  return zonedDateTimeToUtc(
    timezone,
    parts.year,
    parts.month,
    parts.day,
    time.hour,
    time.minute,
    0,
    0,
  );
}

export function getDeadlineForDateKey(
  habit: Pick<Habit, "deadlineTime">,
  dateKey: string,
  timezone: string,
): Date | null {
  const deadlineMinutes = parseTimeToMinutes(habit.deadlineTime);
  if (deadlineMinutes == null) return null;
  const parts = parseDateKey(dateKey);
  const time = minutesToTimeParts(deadlineMinutes);
  return zonedDateTimeToUtc(
    timezone,
    parts.year,
    parts.month,
    parts.day,
    time.hour,
    time.minute,
    0,
    0,
  );
}

export function getDeadlineReminderForDateKey(
  habit: Pick<Habit, "deadlineTime" | "reminderLeadMinutes">,
  dateKey: string,
  timezone: string,
): Date | null {
  const deadlineMinutes = parseTimeToMinutes(habit.deadlineTime);
  if (deadlineMinutes == null) return null;
  const lead = Math.max(0, habit.reminderLeadMinutes ?? 10);
  const reminderMinutes = deadlineMinutes - lead;
  const dayOffset = Math.floor(reminderMinutes / MINUTES_PER_DAY);
  const base = parseDateKey(dateKey);
  const parts = addDaysToDateParts(base.year, base.month, base.day, dayOffset);
  const time = minutesToTimeParts(reminderMinutes);
  return zonedDateTimeToUtc(
    timezone,
    parts.year,
    parts.month,
    parts.day,
    time.hour,
    time.minute,
    0,
    0,
  );
}
export function isTimeDeadlineHabit(
  habit: Pick<Habit, "trackingType">,
): boolean {
  return habit.trackingType === TIME_DEADLINE_TRACKING_TYPE;
}

export function getDeadlineCutoffAt(
  habit: Pick<Habit, "deadlineTime" | "deadlineGraceMinutes">,
  date: Date,
  timezone: string,
): Date | null {
  return getDeadlineCutoffForDateKey(
    habit,
    getLocalDateKey(date, timezone),
    timezone,
  );
}

export function getDeadlineAt(
  habit: Pick<Habit, "deadlineTime">,
  date: Date,
  timezone: string,
): Date | null {
  return getDeadlineForDateKey(
    habit,
    getLocalDateKey(date, timezone),
    timezone,
  );
}

export function getDeadlineReminderAt(
  habit: Pick<Habit, "deadlineTime" | "reminderLeadMinutes">,
  date: Date,
  timezone: string,
): Date | null {
  return getDeadlineReminderForDateKey(
    habit,
    getLocalDateKey(date, timezone),
    timezone,
  );
}

export function isDeadlineLogOnTime(
  habit: Pick<Habit, "deadlineTime" | "deadlineGraceMinutes">,
  loggedAt: Date,
  timezone: string,
): boolean {
  const cutoffAt = getDeadlineCutoffAt(habit, loggedAt, timezone);
  return cutoffAt ? loggedAt <= cutoffAt : true;
}

export function evaluateDeadlineHabitDay(
  habit: DeadlineHabit,
  logs: DeadlineLog[],
  now: Date,
  timezone: string,
): DeadlineEvaluation {
  const dateKey = getLocalDateKey(now, timezone);
  const dayLogs = logs.filter(
    (log) => getLocalDateKey(new Date(log.loggedAt), timezone) === dateKey,
  );
  const completed = dayLogs.some((log) => log.status === "COMPLETED");
  const failed = dayLogs.some((log) => log.status === "FAILED");
  const cutoffAt = getDeadlineCutoffAt(habit, now, timezone);
  const deadlineAt = getDeadlineAt(habit, now, timezone);
  const reminderAt = getDeadlineReminderAt(habit, now, timezone);

  if (completed) {
    return { status: "completed", cutoffAt, deadlineAt, reminderAt, dateKey };
  }
  if (failed) {
    return { status: "late-failed", cutoffAt, deadlineAt, reminderAt, dateKey };
  }
  if (cutoffAt && now > cutoffAt) {
    return { status: "failed", cutoffAt, deadlineAt, reminderAt, dateKey };
  }
  return { status: "pending", cutoffAt, deadlineAt, reminderAt, dateKey };
}

export function formatDeadlineSummary(
  habit: Pick<Habit, "deadlineTime" | "deadlineGraceMinutes">,
): string {
  if (!habit.deadlineTime) return "Deadline not set";
  const grace = habit.deadlineGraceMinutes ?? 0;
  return grace > 0
    ? `By ${habit.deadlineTime} + ${grace} min`
    : `By ${habit.deadlineTime}`;
}
