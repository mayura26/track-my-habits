import { db } from "@/lib/db";
import { normalizeTimezone, startOfDayInTimezone } from "@/lib/timezone";

export class HabitResetError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND",
  ) {
    super(message);
    this.name = "HabitResetError";
  }
}

export async function resetHabit(
  habitId: string,
  userId: string,
  timezone: string,
): Promise<void> {
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
  });
  if (!habit) {
    throw new HabitResetError("Habit not found", "NOT_FOUND");
  }

  const zone = normalizeTimezone(timezone);
  const startDate = startOfDayInTimezone(new Date(), zone);

  await db.$transaction([
    db.habitLog.deleteMany({ where: { habitId } }),
    db.habit.update({
      where: { id: habitId },
      data: {
        startDate,
        currentStreak: 0,
        bestStreak: 0,
      },
    }),
  ]);
}
