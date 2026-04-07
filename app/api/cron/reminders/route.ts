import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { isReminderDue, isSameLocalDay } from "@/lib/task-helpers";
import { getTimePartsInTimezone } from "@/lib/timezone";

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
    },
    include: { user: { select: { timezone: true } } },
  });

  // Find habits with reminders due
  const habits = await db.habit.findMany({
    where: {
      isActive: true,
      reminderEnabled: true,
      reminderTime: { not: null },
    },
    include: { user: { select: { timezone: true } } },
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
      title: `Task reminder: ${task.name}`,
      body: task.description ?? "Don't forget to complete this task!",
      url: "/tasks",
    });

    if (count > 0) {
      await db.task.update({
        where: { id: task.id },
        data: { lastReminderSentAt: now },
      });
      sent += count;
    }
  }

  for (const habit of habits) {
    const timezone = habit.user.timezone ?? "UTC";
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
      title: `Habit reminder: ${habit.name}`,
      body: habit.description ?? "Time to keep your streak going!",
      url: "/habits",
    });

    if (count > 0) {
      await db.habit.update({
        where: { id: habit.id },
        data: { lastReminderSentAt: now },
      });
      sent += count;
    }
  }

  return NextResponse.json({ sent, checked: tasks.length + habits.length });
}
