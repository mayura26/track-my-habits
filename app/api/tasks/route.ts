import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getPeriodRange,
  isLogicallyDue,
  nextDueAt,
  serializeScheduledWeekdays,
} from "@/lib/task-helpers";
import { createTaskSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await db.task.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { category: true },
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
    }),
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
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.categoryId) {
    const category = await db.habitCategory.findFirst({
      where: {
        id: parsed.data.categoryId,
        OR: [{ isDefault: true }, { userId: session.user.id }],
      },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: { formErrors: ["Invalid category"] } },
        { status: 400 },
      );
    }
  }

  const task = await db.task.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      scheduledWeekdays: serializeScheduledWeekdays(
        parsed.data.scheduledWeekdays,
      ),
    },
  });

  return NextResponse.json(task, { status: 201 });
}
