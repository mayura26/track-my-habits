import type { ReminderActionEntityType } from "@/lib/reminder-action-token";

export type ReminderNotificationAction = "complete" | "snooze";

interface ReminderActionUrlInput {
  entityType: ReminderActionEntityType;
  entityId: string;
  actionToken: string;
  action: ReminderNotificationAction;
}

export function buildReminderActionPath({
  entityType,
  entityId,
  actionToken,
  action,
}: ReminderActionUrlInput): string {
  const params = new URLSearchParams({
    entityType,
    entityId,
    action,
    actionToken,
  });
  return `/api/reminders/actions?${params.toString()}`;
}

export function buildReminderActionPaths(
  input: Omit<ReminderActionUrlInput, "action">,
): Record<ReminderNotificationAction, string> {
  return {
    complete: buildReminderActionPath({ ...input, action: "complete" }),
    snooze: buildReminderActionPath({ ...input, action: "snooze" }),
  };
}
