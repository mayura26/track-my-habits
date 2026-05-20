import { db } from "@/lib/db";
import { processHabitLog } from "@/lib/gamification";

export async function completeHabitForUser(habitId: string, userId: string) {
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
  });
  if (!habit) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "UTC";

  const log = await db.habitLog.create({
    data: {
      habitId,
      userId,
      value: 1,
      source: "MANUAL",
      status: "COMPLETED",
    },
  });

  const result = await processHabitLog(habitId, userId, "MANUAL", timezone);

  if (result.xpGained > 0) {
    await db.habitLog.update({
      where: { id: log.id },
      data: { xpAwarded: result.xpGained },
    });
  }

  await db.habit.update({
    where: { id: habitId },
    data: { reminderSnoozedUntil: null },
  });

  return { log, ...result };
}
