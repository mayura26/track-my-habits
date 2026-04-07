import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processHabitLog } from "@/lib/gamification";

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

  // Create log
  const log = await db.habitLog.create({
    data: {
      habitId: habit.id,
      userId: habit.userId,
      value: 1,
      source: "NFC",
      loggedAt: new Date(),
    },
  });

  const result = await processHabitLog(
    habit.id,
    habit.userId,
    "NFC",
    habit.user.timezone ?? "UTC",
  );

  return NextResponse.json({
    ok: true,
    habitName: habit.name,
    categoryColor: habit.category.color,
    log,
    ...result,
  });
}
