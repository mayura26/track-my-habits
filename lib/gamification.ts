import { db } from "@/lib/db";

// ─── XP & Level ───────────────────────────────────────────────────────────────

export function calcLevel(totalXP: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXP / 100)));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function calcXPGain(streak: number, source: string): number {
  const base = 10;
  const streakBonus = Math.min(streak * 2, 50);
  const nfcBonus = source === "NFC" ? 5 : 0;
  return base + streakBonus + nfcBonus;
}

// ─── Streak Algorithm ─────────────────────────────────────────────────────────

interface HabitForStreak {
  id: string;
  thresholdType: string;
  thresholdValue: number;
  thresholdWindow: number | null;
}

export async function calculateStreak(habit: HabitForStreak): Promise<number> {
  const logs = await db.habitLog.findMany({
    where: { habitId: habit.id },
    orderBy: { loggedAt: "desc" },
  });

  if (logs.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (habit.thresholdType === "ROLLING_WINDOW") {
    const windowDays = habit.thresholdWindow ?? 7;
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - windowDays + 1);
    const windowLogs = logs.filter((l) => new Date(l.loggedAt) >= windowStart);
    const windowSum = windowLogs.reduce((s, l) => s + l.value, 0);
    return windowSum >= habit.thresholdValue ? 1 : 0;
  }

  // Group logs by calendar date
  const byDate = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.loggedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    byDate.set(key, (byDate.get(key) ?? 0) + log.value);
  }

  let streak = 0;
  const cursor = new Date(today);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = new Date(cursor).toISOString();
    const daySum = byDate.get(key) ?? 0;

    if (habit.thresholdType === "DAILY") {
      if (daySum >= habit.thresholdValue) {
        streak++;
      } else if (cursor.getTime() === today.getTime()) {
        // today hasn't been completed yet — don't break streak
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
    } else if (habit.thresholdType === "WEEKLY_TOTAL") {
      // Get start of week (Monday)
      const weekStart = new Date(cursor);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekSum = 0;
      const wCursor = new Date(weekStart);
      while (wCursor <= weekEnd) {
        const wKey = new Date(wCursor).toISOString();
        weekSum += byDate.get(wKey) ?? 0;
        wCursor.setDate(wCursor.getDate() + 1);
      }

      const isCurrentWeek = cursor >= weekStart && cursor <= weekEnd;
      if (weekSum >= habit.thresholdValue) {
        streak++;
        cursor.setDate(weekStart.getDate() - 1);
        continue;
      } else if (isCurrentWeek) {
        cursor.setDate(weekStart.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ─── Badge Condition Evaluator ────────────────────────────────────────────────

interface BadgeCondition {
  type: string;
  value: number;
}

interface UserStats {
  totalLogs: number;
  maxStreak: number;
  customCategories: number;
  nfcTokens: number;
  level: number;
  habitCount: number;
}

async function getUserStats(userId: string): Promise<UserStats> {
  const [user, habits, customCategories] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.habit.findMany({ where: { userId, isActive: true } }),
    db.habitCategory.count({ where: { userId, isDefault: false } }),
  ]);

  const maxStreak = Math.max(0, ...habits.map((h) => h.bestStreak));
  const nfcTokens = habits.filter((h) => h.nfcToken !== null).length;

  return {
    totalLogs: user?.totalLogsCount ?? 0,
    maxStreak,
    customCategories,
    nfcTokens,
    level: user?.level ?? 1,
    habitCount: habits.length,
  };
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const [allBadges, earnedBadges, stats] = await Promise.all([
    db.badge.findMany(),
    db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    getUserStats(userId),
  ]);

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));
  const newlyEarned: string[] = [];

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;

    let condition: BadgeCondition;
    try {
      condition = JSON.parse(badge.condition) as BadgeCondition;
    } catch {
      console.warn(`Skipping badge "${badge.name}" with invalid condition`);
      continue;
    }
    let earned = false;

    switch (condition.type) {
      case "totalLogs":
        earned = stats.totalLogs >= condition.value;
        break;
      case "maxStreak":
        earned = stats.maxStreak >= condition.value;
        break;
      case "customCategories":
        earned = stats.customCategories >= condition.value;
        break;
      case "nfcTokens":
        earned = stats.nfcTokens >= condition.value;
        break;
      case "level":
        earned = stats.level >= condition.value;
        break;
      case "habitCount":
        earned = stats.habitCount >= condition.value;
        break;
    }

    if (earned) {
      await db.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newlyEarned.push(badge.name);
    }
  }

  return newlyEarned;
}

// ─── Simple XP Award (for Tasks) ─────────────────────────────────────────────

export async function awardXP(userId: string, amount: number): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const newXP = user.xp + amount;
  const newLevel = Math.max(1, calcLevel(newXP));
  await db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

interface ProcessResult {
  streak: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges: string[];
}

export async function processHabitLog(
  habitId: string,
  userId: string,
  source: string,
): Promise<ProcessResult> {
  const habit = await db.habit.findUniqueOrThrow({ where: { id: habitId } });

  // Recalculate streak
  const newStreak = await calculateStreak(habit);
  const bestStreak = Math.max(habit.bestStreak, newStreak);

  await db.habit.update({
    where: { id: habitId },
    data: { currentStreak: newStreak, bestStreak },
  });

  // Award XP (skip for backfilled logs)
  const xpGained = source === "BACKFILL" ? 0 : calcXPGain(newStreak, source);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const oldLevel = user.level;
  const newXP = user.xp + xpGained;
  const newLevel = Math.max(1, calcLevel(newXP));

  await db.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
      ...(source !== "BACKFILL" ? { totalLogsCount: { increment: 1 } } : {}),
    },
  });

  // Check badges
  const newBadges = await checkAndAwardBadges(userId);

  return {
    streak: newStreak,
    xpGained,
    leveledUp: newLevel > oldLevel,
    newLevel,
    newBadges,
  };
}
