import { db } from "@/lib/db";
import { awardXP, checkAndAwardBadges } from "@/lib/gamification";
import { getPeriodRange } from "@/lib/task-helpers";

export async function completeTaskForUser(taskId: string, userId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, userId, isActive: true },
  });
  if (!task) return null;

  const log = await db.taskLog.create({
    data: {
      taskId,
      userId,
    },
  });

  await awardXP(userId, 10);
  const newBadges = await checkAndAwardBadges(userId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  await db.task.update({
    where: { id: taskId },
    data: { reminderSnoozedUntil: null },
  });

  return { log, xp: user?.xp, level: user?.level, newBadges };
}

export async function completeTaskReminderForUser(
  taskId: string,
  userId: string,
) {
  const task = await db.task.findFirst({
    where: { id: taskId, userId, isActive: true },
  });
  if (!task) return null;

  const userSettings = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = userSettings?.timezone ?? "UTC";
  const { start, end } = getPeriodRange(task.frequency, new Date(), timezone);
  const periodCount = await db.taskLog.count({
    where: {
      taskId,
      userId,
      completedAt: { gte: start, lte: end },
    },
  });
  const missingCount = Math.max(0, task.frequencyValue - periodCount);

  let logs: Awaited<ReturnType<typeof db.taskLog.create>>[] = [];
  if (missingCount > 0) {
    logs = await Promise.all(
      Array.from({ length: missingCount }, () =>
        db.taskLog.create({
          data: {
            taskId,
            userId,
          },
        }),
      ),
    );

    await awardXP(userId, 10 * missingCount);
  }

  const newBadges = missingCount > 0 ? await checkAndAwardBadges(userId) : [];

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  await db.task.update({
    where: { id: taskId },
    data: { reminderSnoozedUntil: null },
  });

  return {
    logs,
    completedCount: logs.length,
    alreadyComplete: missingCount === 0,
    xp: user?.xp,
    level: user?.level,
    newBadges,
  };
}
