import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import {
  isReminderDue,
  isSameLocalDay,
  isScheduledForToday,
} from "@/lib/task-helpers";
import { getLocalDateKey, getTimePartsInTimezone } from "@/lib/timezone";

function isHabitDoneToday(
  habit: {
    thresholdType: string;
    thresholdValue: number;
    logs: { loggedAt: Date; value: number }[];
  },
  now: Date,
  timezone: string,
): boolean {
  const todayKey = getLocalDateKey(now, timezone);
  const sum = habit.logs
    .filter(
      (log) => getLocalDateKey(new Date(log.loggedAt), timezone) === todayKey,
    )
    .reduce((total, log) => total + log.value, 0);

  return habit.thresholdType === "DAILY"
    ? sum >= habit.thresholdValue
    : sum > 0;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find tasks with reminders due
  const tasks = await db.task.findMany({
    where: {
      isActive: true,
      reminderEnabled: true,
      reminderTime: { not: null },
      OR: [
        { reminderSnoozedUntil: null },
        { reminderSnoozedUntil: { lte: now } },
      ],
    },
    include: { logs: true, user: { select: { timezone: true } } },
  });

  // Find habits with reminders due
  const habits = await db.habit.findMany({
    where: {
      isActive: true,
      reminderEnabled: true,
      reminderTime: { not: null },
      OR: [
        { reminderSnoozedUntil: null },
        { reminderSnoozedUntil: { lte: now } },
      ],
    },
    include: { logs: true, user: { select: { timezone: true } } },
  });

  let sent = 0;

  for (const task of tasks) {
    const timezone = task.user.timezone ?? "UTC";
    if (!isReminderDue(task, now, timezone)) continue;

    // Skip if already sent today
    if (
      task.lastReminderSentAt &&
      isSameLocalDay(task.lastReminderSentAt, now, timezone)
    )
      continue;

    const count = await sendPushToUser(task.userId, {
      title: "Task reminder",
      body: task.name,
      url: "/tasks",
      entityType: "task",
      entityId: task.id,
    });

    if (count > 0) {
      await db.task.update({
        where: { id: task.id },
        data: { lastReminderSentAt: now, reminderSnoozedUntil: null },
      });
      sent += count;
    }
  }

  for (const habit of habits) {
    const timezone = habit.user.timezone ?? "UTC";
    if (!isScheduledForToday(habit, now, timezone)) continue;
    if (isHabitDoneToday(habit, now, timezone)) continue;
    if (!habit.reminderTime) continue;
    const [h, m] = habit.reminderTime.split(":").map(Number);
    const local = getTimePartsInTimezone(now, timezone);
    const currentMinutes = local.hour * 60 + local.minute;
    if (currentMinutes < h * 60 + m) continue;

    // Skip if already sent today
    if (
      habit.lastReminderSentAt &&
      isSameLocalDay(habit.lastReminderSentAt, now, timezone)
    )
      continue;

    const count = await sendPushToUser(habit.userId, {
      title: "Habit reminder",
      body: habit.name,
      url: "/habits",
      entityType: "habit",
      entityId: habit.id,
    });

    if (count > 0) {
      await db.habit.update({
        where: { id: habit.id },
        data: { lastReminderSentAt: now, reminderSnoozedUntil: null },
      });
      sent += count;
    }
  }

  return NextResponse.json({ sent, checked: tasks.length + habits.length });
}
