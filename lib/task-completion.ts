import { db } from "@/lib/db";
import { awardXP, checkAndAwardBadges } from "@/lib/gamification";

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
