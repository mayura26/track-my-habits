import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  calcLevel,
  calculateStreak,
  processHabitLog,
} from "@/lib/gamification";
import {
  endOfDayInTimezone,
  startOfDayInTimezone,
  zonedDateTimeToUtc,
} from "@/lib/timezone";
import { logHabitSchema } from "@/lib/validations";

// Build a canonical noon-in-user-timezone timestamp from a YYYY-MM-DD key.
// The client sends dateKey so the resulting UTC moment always buckets back to
// the intended day regardless of the browser's local timezone.
function dateKeyToUtcNoon(dateKey: string, timezone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return zonedDateTimeToUtc(timezone, y, m, d, 12, 0, 0, 0);
}

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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "UTC";

  const body = await req.json().catch(() => ({}));
  const parsed = logHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const loggedAt = parsed.data.dateKey
    ? dateKeyToUtcNoon(parsed.data.dateKey, timezone)
    : parsed.data.loggedAt
      ? new Date(parsed.data.loggedAt)
      : new Date();

  // Backfill is idempotent: if a log with the same status already exists on
  // this day, return it without creating a duplicate. This protects against
  // double-clicks and retries (a real user just had 5 duplicate FAILED rows
  // pile up from frantic clicking when an earlier bug made buttons look
  // unresponsive).
  if (parsed.data.source === "BACKFILL") {
    const dayStart = startOfDayInTimezone(loggedAt, timezone);
    const dayEnd = new Date(
      endOfDayInTimezone(loggedAt, timezone).getTime() + 1,
    );
    const existing = await db.habitLog.findFirst({
      where: {
        habitId: id,
        userId: session.user.id,
        loggedAt: { gte: dayStart, lt: dayEnd },
        status: parsed.data.status,
      },
    });
    if (existing) {
      const newStreak = await calculateStreak(habit, timezone);
      return NextResponse.json(
        {
          log: existing,
          streak: newStreak,
          xpGained: 0,
          leveledUp: false,
          newLevel: 0,
          newBadges: [],
          deduped: true,
        },
        { status: 200 },
      );
    }
  }

  const log = await db.habitLog.create({
    data: {
      habitId: id,
      userId: session.user.id,
      value: parsed.data.value,
      source: parsed.data.source,
      status: parsed.data.status,
      loggedAt,
    },
  });

  // FAILED logs bypass the XP pipeline entirely — we only recompute the streak
  // (which already excludes FAILED rows) so the habit's currentStreak reflects
  // the broken chain. No XP, no totalLogsCount bump, no badge check.
  if (parsed.data.status === "FAILED") {
    const newStreak = await calculateStreak(habit, timezone);
    const bestStreak = Math.max(habit.bestStreak, newStreak);
    await db.habit.update({
      where: { id: habit.id },
      data: { currentStreak: newStreak, bestStreak },
    });
    return NextResponse.json(
      {
        log,
        streak: newStreak,
        xpGained: 0,
        leveledUp: false,
        newLevel: 0,
        newBadges: [],
      },
      { status: 201 },
    );
  }

  const result = await processHabitLog(
    id,
    session.user.id,
    parsed.data.source,
    timezone,
  );

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
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "UTC";

  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Support date-specific deletion via ?dateKey= (preferred, timezone-safe)
  // or legacy ?loggedAt= query param, with an optional ?status= filter so the
  // backfill UI can target a failed log specifically even if both a completed
  // and a failed log exist on the date.
  const url = new URL(req.url);
  const dateKeyParam = url.searchParams.get("dateKey");
  const loggedAtParam = url.searchParams.get("loggedAt");
  const statusParam = url.searchParams.get("status");

  const targetDate = dateKeyParam
    ? dateKeyToUtcNoon(dateKeyParam, timezone)
    : loggedAtParam
      ? new Date(loggedAtParam)
      : new Date();
  const dayStart = startOfDayInTimezone(targetDate, timezone);
  const dayEnd = new Date(
    endOfDayInTimezone(targetDate, timezone).getTime() + 1,
  );

  const latestLog = await db.habitLog.findFirst({
    where: {
      habitId: id,
      userId: session.user.id,
      loggedAt: { gte: dayStart, lt: dayEnd },
      ...(statusParam ? { status: statusParam } : {}),
    },
    orderBy: { loggedAt: "desc" },
  });

  if (!latestLog) {
    return NextResponse.json({ error: "No log to undo" }, { status: 404 });
  }

  await db.habitLog.delete({ where: { id: latestLog.id } });

  // Skip XP reversal for backfill and failed logs (no XP was ever awarded)
  if (latestLog.source !== "BACKFILL" && latestLog.status !== "FAILED") {
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
  const newStreak = await calculateStreak(habit, timezone);
  await db.habit.update({
    where: { id: habit.id },
    data: { currentStreak: newStreak },
  });

  return NextResponse.json({ undone: true, streak: newStreak });
}
