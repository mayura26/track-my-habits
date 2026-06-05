import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { completeHabitReminderForUser } from "@/lib/habit-completion";
import { verifyReminderActionToken } from "@/lib/reminder-action-token";
import { completeTaskReminderForUser } from "@/lib/task-completion";
import { reminderActionSchema } from "@/lib/validations";

const SNOOZE_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const queryBody = {
    entityType: searchParams.get("entityType"),
    entityId: searchParams.get("entityId"),
    action: searchParams.get("action"),
    actionToken: searchParams.get("actionToken") ?? undefined,
  };
  const body = await req.json().catch(() => ({}));
  const parsed = reminderActionSchema.safeParse({
    ...queryBody,
    ...body,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { entityType, entityId, action, actionToken } = parsed.data;
  const session = await auth();
  let userId = session?.user?.id ?? null;

  if (!userId) {
    const tokenPayload = actionToken
      ? verifyReminderActionToken(actionToken)
      : null;

    if (
      !tokenPayload ||
      tokenPayload.entityType !== entityType ||
      tokenPayload.entityId !== entityId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = tokenPayload.subscriptionId
      ? await db.pushSubscription.findFirst({
          where: {
            id: tokenPayload.subscriptionId,
            userId: tokenPayload.userId,
          },
          select: { id: true },
        })
      : null;

    if (tokenPayload.subscriptionId && !subscription) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = tokenPayload.userId;
  }

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
