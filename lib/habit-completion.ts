import { db } from "@/lib/db";
import { calculateStreak, processHabitLog } from "@/lib/gamification";
import { isDeadlineLogOnTime, isTimeDeadlineHabit } from "@/lib/habit-deadline";
import { endOfDayInTimezone, startOfDayInTimezone } from "@/lib/timezone";

async function finishFailedHabitLog(
  habit: Parameters<typeof calculateStreak>[0],
  habitId: string,
  timezone: string,
  userLevel = 1,
) {
  const streak = await calculateStreak(habit, timezone);
  await db.habit.update({
    where: { id: habitId },
    data: { currentStreak: streak, reminderSnoozedUntil: null },
  });
  return {
    streak,
    xpGained: 0,
    leveledUp: false,
    newLevel: userLevel,
    newBadges: [],
  };
}

export async function completeHabitForUser(habitId: string, userId: string) {
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
  });
  if (!habit) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, level: true },
  });
  const timezone = user?.timezone ?? "UTC";
  const now = new Date();
  const status =
    isTimeDeadlineHabit(habit) && !isDeadlineLogOnTime(habit, now, timezone)
      ? "FAILED"
      : "COMPLETED";

  const log = await db.habitLog.create({
    data: {
      habitId,
      userId,
      value: status === "FAILED" ? 0 : 1,
      source: "MANUAL",
      status,
      loggedAt: now,
    },
  });

  if (status === "FAILED") {
    const result = await finishFailedHabitLog(
      habit,
      habitId,
      timezone,
      user?.level ?? 1,
    );
    return { log, ...result };
  }

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

export async function completeHabitReminderForUser(
  habitId: string,
  userId: string,
) {
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
  });
  if (!habit) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, level: true },
  });
  const timezone = user?.timezone ?? "UTC";

  if (isTimeDeadlineHabit(habit)) {
    const now = new Date();
    const status = isDeadlineLogOnTime(habit, now, timezone)
      ? "COMPLETED"
      : "FAILED";
    const log = await db.habitLog.create({
      data: {
        habitId,
        userId,
        value: status === "FAILED" ? 0 : 1,
        source: "MANUAL",
        status,
        loggedAt: now,
      },
    });

    if (status === "FAILED") {
      const result = await finishFailedHabitLog(
        habit,
        habitId,
        timezone,
        user?.level ?? 1,
      );
      return {
        log,
        alreadyComplete: false,
        completedValue: 0,
        ...result,
      };
    }

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

    return {
      log,
      alreadyComplete: false,
      completedValue: 1,
      ...result,
    };
  }

  const now = new Date();
  const dayStart = startOfDayInTimezone(now, timezone);
  const dayEnd = new Date(endOfDayInTimezone(now, timezone).getTime() + 1);
  const todayLogs = await db.habitLog.findMany({
    where: {
      habitId,
      userId,
      status: "COMPLETED",
      loggedAt: { gte: dayStart, lt: dayEnd },
    },
  });
  const todaySum = todayLogs.reduce((sum, log) => sum + log.value, 0);
  const missingValue = Math.max(0, habit.thresholdValue - todaySum);

  if (missingValue <= 0) {
    await db.habit.update({
      where: { id: habitId },
      data: { reminderSnoozedUntil: null },
    });
    return {
      log: null,
      alreadyComplete: true,
      completedValue: 0,
      streak: habit.currentStreak,
      xpGained: 0,
      leveledUp: false,
      newLevel: user?.level ?? 1,
      newBadges: [],
    };
  }

  const log = await db.habitLog.create({
    data: {
      habitId,
      userId,
      value: missingValue,
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

  return {
    log,
    alreadyComplete: false,
    completedValue: missingValue,
    ...result,
  };
}
