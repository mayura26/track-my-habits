import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buildReminderActionPaths } from "@/lib/reminder-action-urls";
import { reminderActionTokenSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reminderActionTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { entityType, entityId, subscriptionEndpoint } = parsed.data;
  const entity =
    entityType === "task"
      ? await db.task.findFirst({
          where: { id: entityId, userId: session.user.id, isActive: true },
          select: { id: true },
        })
      : await db.habit.findFirst({
          where: { id: entityId, userId: session.user.id, isActive: true },
          select: { id: true },
        });

  if (!entity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subscription = subscriptionEndpoint
    ? await db.pushSubscription.findFirst({
        where: {
          endpoint: subscriptionEndpoint,
          userId: session.user.id,
        },
        select: { id: true },
      })
    : null;

  const actionUrls = buildReminderActionPaths({
    userId: session.user.id,
    subscriptionId: subscription?.id,
    entityType,
    entityId,
  });

  return NextResponse.json({
    actionToken: actionUrls.complete.replace("/reminder/a/", ""),
    actionUrls,
  });
}
