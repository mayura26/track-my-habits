import {
  type ReminderActionEntityType,
  type SignReminderActionTokenInput,
  signReminderActionToken,
} from "@/lib/reminder-action-token";

export type ReminderNotificationAction = "complete" | "snooze";

interface ReminderActionUrlInput {
  entityType: ReminderActionEntityType;
  entityId: string;
  actionToken: string;
  action: ReminderNotificationAction;
}

export function buildReminderActionTokenPath(token: string): string {
  return `/reminder/a/${token}`;
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
  return `/reminder/action?${params.toString()}`;
}

export function buildReminderActionApiPath({
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
  input: Omit<SignReminderActionTokenInput, "action">,
): Record<ReminderNotificationAction, string> {
  const completeToken = signReminderActionToken({
    ...input,
    action: "complete",
  });
  const snoozeToken = signReminderActionToken({ ...input, action: "snooze" });

  return {
    complete: buildReminderActionTokenPath(completeToken),
    snooze: buildReminderActionTokenPath(snoozeToken),
  };
}

export function parseReminderActionFromUrl(
  url: string,
): ReminderNotificationAction | null {
  try {
    const action = new URL(url, "http://localhost").searchParams.get("action");
    if (action === "complete" || action === "snooze") return action;
    return null;
  } catch {
    return null;
  }
}
