import { db } from "@/lib/db";
import { completeHabitReminderForUser } from "@/lib/habit-completion";
import {
  verifyReminderActionToken,
  type ReminderActionEntityType,
  type ReminderNotificationAction,
} from "@/lib/reminder-action-token";
import { completeTaskReminderForUser } from "@/lib/task-completion";

const SNOOZE_MS = 30 * 60 * 1000;

export type ReminderActionErrorCode =
  | "invalid"
  | "unauthorized"
  | "not_found";

export type ReminderActionSuccess = {
  ok: true;
  action: ReminderNotificationAction;
  entityType: ReminderActionEntityType;
  result?: unknown;
  reminderSnoozedUntil?: Date;
  message?: string;
};

export type ReminderActionFailure = {
  ok: false;
  error: ReminderActionErrorCode;
};

export type ReminderActionOutcome =
  | ReminderActionSuccess
  | ReminderActionFailure;

interface PerformReminderActionInput {
  entityType: ReminderActionEntityType;
  entityId: string;
  action: ReminderNotificationAction;
  actionToken?: string;
  userId?: string | null;
}

export async function resolveReminderActionUserId(
  input: Pick<
    PerformReminderActionInput,
    "entityType" | "entityId" | "actionToken" | "userId"
  >,
): Promise<string | null> {
  if (input.userId) return input.userId;

  const tokenPayload = input.actionToken
    ? verifyReminderActionToken(input.actionToken)
    : null;

  if (
    !tokenPayload ||
    tokenPayload.entityType !== input.entityType ||
    tokenPayload.entityId !== input.entityId
  ) {
    return null;
  }

  if (tokenPayload.subscriptionId) {
    const subscription = await db.pushSubscription.findFirst({
      where: {
        id: tokenPayload.subscriptionId,
        userId: tokenPayload.userId,
      },
      select: { id: true },
    });

    if (!subscription) return null;
  }

  return tokenPayload.userId;
}

export async function performReminderAction(
  input: PerformReminderActionInput,
): Promise<ReminderActionOutcome> {
  let action = input.action;
  if (input.actionToken) {
    const tokenPayload = verifyReminderActionToken(input.actionToken);
    if (tokenPayload?.action) {
      if (action && action !== tokenPayload.action) {
        return { ok: false, error: "unauthorized" };
      }
      action = tokenPayload.action;
    }
  }

  const userId = await resolveReminderActionUserId(input);
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  const { entityType, entityId } = input;

  if (entityType === "test") {
    return {
      ok: true,
      action,
      entityType,
      message:
        action === "complete"
          ? "Done reached the server."
          : "Snooze reached the server.",
      result: {
        confirmed: true,
        message:
          action === "complete"
            ? "Done reached the server."
            : "Snooze reached the server.",
      },
    };
  }

  if (action === "complete") {
    const result =
      entityType === "task"
        ? await completeTaskReminderForUser(entityId, userId)
        : await completeHabitReminderForUser(entityId, userId);

    if (!result) {
      return { ok: false, error: "not_found" };
    }

    return { ok: true, action, entityType, result };
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
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    action,
    entityType,
    reminderSnoozedUntil,
    message: "Snoozed for 30 minutes.",
  };
}

export async function performReminderActionFromToken(
  token: string,
): Promise<ReminderActionOutcome> {
  const tokenPayload = verifyReminderActionToken(token);
  if (!tokenPayload?.action) {
    return { ok: false, error: "invalid" };
  }

  return performReminderAction({
    entityType: tokenPayload.entityType,
    entityId: tokenPayload.entityId,
    action: tokenPayload.action,
    actionToken: token,
  });
}
