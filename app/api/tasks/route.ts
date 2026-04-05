import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations";
import { getPeriodRange, isLogicallyDue, nextDueAt } from "@/lib/task-helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await db.task.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Attach period logs + computed due state for each task
  const tasksWithMeta = await Promise.all(
    tasks.map(async (task) => {
      const { start, end } = getPeriodRange(task.frequency);
      const logs = await db.taskLog.findMany({
        where: { taskId: task.id, completedAt: { gte: start, lte: end } },
        orderBy: { completedAt: "desc" },
      });
      const latest = await db.taskLog.findFirst({
        where: { taskId: task.id },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      });
      const withLogs = { ...task, logs };
      return {
        ...withLogs,
        lastCompletedAt: latest?.completedAt ?? null,
        isDue: isLogicallyDue(withLogs),
        nextDueAt: nextDueAt(withLogs),
      };
    })
  );

  return NextResponse.json(tasksWithMeta);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
