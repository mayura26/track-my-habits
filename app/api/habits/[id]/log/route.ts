import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  calcLevel,
  calculateStreak,
  processHabitLog,
} from "@/lib/gamification";
import { logHabitSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = logHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const loggedAt = parsed.data.loggedAt
    ? new Date(parsed.data.loggedAt)
    : new Date();

  const log = await db.habitLog.create({
    data: {
      habitId: id,
      userId: session.user.id,
      value: parsed.data.value,
      source: parsed.data.source,
      loggedAt,
    },
  });

  const result = await processHabitLog(id, session.user.id, parsed.data.source);

  // Store actual XP awarded so undo can reverse the correct amount
  if (result.xpGained > 0) {
    await db.habitLog.update({
      where: { id: log.id },
      data: { xpAwarded: result.xpGained },
    });
  }

  return NextResponse.json({ log, ...result }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Support date-specific deletion via ?loggedAt= query param
  const url = new URL(req.url);
  const loggedAtParam = url.searchParams.get("loggedAt");

  const targetDate = loggedAtParam ? new Date(loggedAtParam) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const latestLog = await db.habitLog.findFirst({
    where: {
      habitId: id,
      userId: session.user.id,
      loggedAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { loggedAt: "desc" },
  });

  if (!latestLog) {
    return NextResponse.json({ error: "No log to undo" }, { status: 404 });
  }

  await db.habitLog.delete({ where: { id: latestLog.id } });

  // Skip XP reversal for backfill logs (no XP was awarded)
  if (latestLog.source !== "BACKFILL") {
    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
    });
    const xpToReverse = latestLog.xpAwarded || 10;
    const newXP = Math.max(0, user.xp - xpToReverse);
    const newLevel = Math.max(1, calcLevel(newXP));
    await db.user.update({
      where: { id: session.user.id },
      data: {
        xp: newXP,
        level: newLevel,
        totalLogsCount: { decrement: 1 },
      },
    });
  }

  // Recalculate streak after removing the log
  const newStreak = await calculateStreak(habit);
  await db.habit.update({
    where: { id: habit.id },
    data: { currentStreak: newStreak },
  });

  return NextResponse.json({ undone: true, streak: newStreak });
}
