import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calcLevel } from "@/lib/gamification";
import { completeTaskForUser } from "@/lib/task-completion";
import { getPeriodRange } from "@/lib/task-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await completeTaskForUser(id, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
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
  const task = await db.task.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userTimezone =
    (
      await db.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
      })
    )?.timezone ?? "UTC";

  // Find the most recent log in the current period
  const { start, end } = getPeriodRange(
    task.frequency,
    new Date(),
    userTimezone,
  );
  const latestLog = await db.taskLog.findFirst({
    where: {
      taskId: id,
      userId: session.user.id,
      completedAt: { gte: start, lte: end },
    },
    orderBy: { completedAt: "desc" },
  });

  if (!latestLog) {
    return NextResponse.json({ error: "No log to undo" }, { status: 404 });
  }

  await db.taskLog.delete({ where: { id: latestLog.id } });

  // Reverse 10 XP
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  const newXP = Math.max(0, user.xp - 10);
  const newLevel = Math.max(1, calcLevel(newXP));
  await db.user.update({
    where: { id: session.user.id },
    data: { xp: newXP, level: newLevel },
  });

  return NextResponse.json({ undone: true, xp: newXP, level: newLevel });
}
