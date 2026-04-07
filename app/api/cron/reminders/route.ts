import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { isScheduledForToday } from "@/lib/task-helpers";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Find tasks with reminders due
  const tasks = await db.task.findMany({
    where: {
      isActive: true,
      reminderEnabled: true,
      reminderTime: { not: null },
    },
  });

  // Find habits with reminders due
  const habits = await db.habit.findMany({
    where: {
      isActive: true,
      reminderEnabled: true,
      reminderTime: { not: null },
    },
  });

  let sent = 0;

  for (const task of tasks) {
    if (!task.reminderTime || task.reminderTime > currentHHMM) continue;
    if (!isScheduledForToday(task, now)) continue;

    // Skip if already sent today
    if (
      task.lastReminderSentAt &&
      task.lastReminderSentAt.toISOString().slice(0, 10) === todayStr
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
    if (!habit.reminderTime || habit.reminderTime > currentHHMM) continue;

    // Skip if already sent today
    if (
      habit.lastReminderSentAt &&
      habit.lastReminderSentAt.toISOString().slice(0, 10) === todayStr
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
