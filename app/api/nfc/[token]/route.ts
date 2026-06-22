import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateStreak, processHabitLog } from "@/lib/gamification";
import { isDeadlineLogOnTime, isTimeDeadlineHabit } from "@/lib/habit-deadline";

// Public route — no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const habit = await db.habit.findUnique({
    where: { nfcToken: token },
    include: { category: true, user: true },
  });

  if (!habit || !habit.isActive) {
    return NextResponse.json({ error: "Invalid NFC token" }, { status: 404 });
  }

  const now = new Date();
  const timezone = habit.user.timezone ?? "UTC";
  const status =
    isTimeDeadlineHabit(habit) && !isDeadlineLogOnTime(habit, now, timezone)
      ? "FAILED"
      : "COMPLETED";

  const log = await db.habitLog.create({
    data: {
      habitId: habit.id,
      userId: habit.userId,
      value: status === "FAILED" ? 0 : 1,
      source: "NFC",
      status,
      loggedAt: now,
    },
  });

  if (status === "FAILED") {
    const streak = await calculateStreak(habit, timezone);
    await db.habit.update({
      where: { id: habit.id },
      data: { currentStreak: streak },
    });
    return NextResponse.json({
      ok: true,
      habitName: habit.name,
      categoryColor: habit.category.color,
      log,
      streak,
      xpGained: 0,
      leveledUp: false,
      newLevel: habit.user.level,
      newBadges: [],
    });
  }

  const result = await processHabitLog(habit.id, habit.userId, "NFC", timezone);

  return NextResponse.json({
    ok: true,
    habitName: habit.name,
    categoryColor: habit.category.color,
    log,
    ...result,
  });
}
