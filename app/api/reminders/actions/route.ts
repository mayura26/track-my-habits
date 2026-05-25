import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { completeHabitReminderForUser } from "@/lib/habit-completion";
import { completeTaskReminderForUser } from "@/lib/task-completion";
import { reminderActionSchema } from "@/lib/validations";

const SNOOZE_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reminderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { entityType, entityId, action } = parsed.data;
  const userId = session.user.id;

  if (action === "complete") {
    const result =
      entityType === "task"
        ? await completeTaskReminderForUser(entityId, userId)
        : await completeHabitReminderForUser(entityId, userId);

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, action, entityType, result });
  }

  const reminderSnoozedUntil = new Date(Date.now() + SNOOZE_MS);
  const update =
    entityType === "task"
      ? await db.task.updateMany({
          where: { id: entityId, userId, isActive: true },
          data: { reminderSnoozedUntil, lastReminderSentAt: null },
        })
      : await db.habit.updateMany({
          where: { id: entityId, userId, isActive: true },
          data: { reminderSnoozedUntil, lastReminderSentAt: null },
        });

  if (update.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    action,
    entityType,
    reminderSnoozedUntil,
  });
}
