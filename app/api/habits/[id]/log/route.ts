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

  return NextResponse.json({ log, ...result }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
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

  // Find today's most recent log
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestLog = await db.habitLog.findFirst({
    where: {
      habitId: id,
      userId: session.user.id,
      loggedAt: { gte: today },
    },
    orderBy: { loggedAt: "desc" },
  });

  if (!latestLog) {
    return NextResponse.json({ error: "No log to undo" }, { status: 404 });
  }

  // Reverse XP from that log (base 10 + streak bonus, approximate with fixed 10)
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  const newXP = Math.max(0, user.xp - 10);
  const newLevel = Math.max(1, calcLevel(newXP));

  await db.habitLog.delete({ where: { id: latestLog.id } });

  // Recalculate streak after removing the log
  const newStreak = await calculateStreak(habit);
  await db.habit.update({
    where: { id: habit.id },
    data: { currentStreak: newStreak },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: {
      xp: newXP,
      level: newLevel,
      totalLogsCount: { decrement: 1 },
    },
  });

  return NextResponse.json({
    undone: true,
    streak: newStreak,
    xp: newXP,
    level: newLevel,
  });
}
