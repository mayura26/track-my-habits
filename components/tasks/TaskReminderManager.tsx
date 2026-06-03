"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  registerServiceWorker,
  sendSubscriptionToServer,
  subscribeToPush,
} from "@/lib/push-client";
import { isScheduledForToday } from "@/lib/task-helpers";
import { getLocalDateKey, getTimePartsInTimezone } from "@/lib/timezone";

type ReminderEntityType = "task" | "habit";

type NotificationOptionsWithActions = NotificationOptions & {
  actions?: { action: string; title: string; icon?: string }[];
};

interface ReminderBase {
  id: string;
  name: string;
  reminderEnabled: boolean;
  reminderTime: string | null;
  reminderSnoozedUntil?: string | null;
  scheduledWeekdays: string | null;
}

interface ReminderActionTokenResponse {
  actionToken?: string;
}

interface ReminderTask extends ReminderBase {
  isDue?: boolean;
}

interface ReminderHabit extends ReminderBase {
  thresholdType: string;
  thresholdValue: number;
  logs: { loggedAt: string; value: number }[];
}

function getFiredKey(
  entityType: ReminderEntityType,
  entityId: string,
  timezone: string,
): string {
  const today = getLocalDateKey(new Date(), timezone);
  return `reminder_fired:${entityType}:${entityId}:${today}`;
}

function parseSnoozedUntil(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSnoozed(
  item: Pick<ReminderBase, "reminderSnoozedUntil">,
  now: Date,
): boolean {
  const snoozedUntil = parseSnoozedUntil(item.reminderSnoozedUntil);
  return snoozedUntil ? snoozedUntil > now : false;
}

function shouldSuppressLocalReminder(
  entityType: ReminderEntityType,
  item: ReminderBase,
  timezone: string,
  now: Date,
): boolean {
  const key = getFiredKey(entityType, item.id, timezone);
  if (!localStorage.getItem(key)) return false;

  const snoozedUntil = parseSnoozedUntil(item.reminderSnoozedUntil);
  if (snoozedUntil && snoozedUntil <= now) {
    localStorage.removeItem(key);
    return false;
  }

  return true;
}

function markLocalReminderFired(
  entityType: ReminderEntityType,
  entityId: string,
  timezone: string,
): void {
  localStorage.setItem(getFiredKey(entityType, entityId, timezone), "1");
}

function isReminderTimeReached(
  item: Pick<
    ReminderBase,
    "reminderEnabled" | "reminderTime" | "scheduledWeekdays"
  >,
  now: Date,
  timezone: string,
): boolean {
  if (!item.reminderEnabled || !item.reminderTime) return false;
  if (!isScheduledForToday(item, now, timezone)) return false;

  const [hStr, mStr] = item.reminderTime.split(":");
  const reminderHour = Number(hStr);
  const reminderMin = Number(mStr);
  const local = getTimePartsInTimezone(now, timezone);
  const currentMinutes = local.hour * 60 + local.minute;
  const reminderMinutes = reminderHour * 60 + reminderMin;
  return currentMinutes >= reminderMinutes;
}

function isHabitDoneToday(
  habit: ReminderHabit,
  now: Date,
  timezone: string,
): boolean {
  const todayKey = getLocalDateKey(now, timezone);
  const sum = habit.logs
    .filter(
      (log) => getLocalDateKey(new Date(log.loggedAt), timezone) === todayKey,
    )
    .reduce((total, log) => total + log.value, 0);

  return habit.thresholdType === "DAILY"
    ? sum >= habit.thresholdValue
    : sum > 0;
}

async function showReminderNotification(
  registration: ServiceWorkerRegistration,
  entityType: ReminderEntityType,
  item: ReminderBase,
) {
  let actionToken: string | undefined;
  try {
    const subscription = await registration.pushManager.getSubscription();
    const json = subscription?.toJSON();
    const res = await fetch("/api/reminders/action-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType,
        entityId: item.id,
        subscriptionEndpoint: json?.endpoint,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as ReminderActionTokenResponse;
      actionToken = data.actionToken;
    }
  } catch {
    actionToken = undefined;
  }

  const options: NotificationOptionsWithActions = {
    body: item.name,
    icon: "/icons/icon-192.png",
    badge: "/icons/notification-badge.png",
    data: {
      url: entityType === "task" ? "/tasks" : "/habits",
      entityType,
      entityId: item.id,
      actionToken,
    },
    actions: [
      { action: "complete", title: "Done" },
      { action: "snooze", title: "Snooze" },
    ],
  };

  await registration.showNotification(
    entityType === "task" ? "Task reminder" : "Habit reminder",
    options,
  );
}

export function TaskReminderManager() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "reminder-action-complete") {
        router.refresh();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [router]);

  useEffect(() => {
    async function setupPush(): Promise<ServiceWorkerRegistration | null> {
      try {
        const registration = await registerServiceWorker();
        if (!registration) return null;
        const subscription = await subscribeToPush(registration);
        if (subscription) {
          await sendSubscriptionToServer(subscription);
        }
        return registration;
      } catch (err) {
        console.warn("Push setup failed:", err);
        return null;
      }
    }

    async function checkReminders(registration: ServiceWorkerRegistration) {
      if (!("Notification" in window)) return;

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;

      let tasks: ReminderTask[] = [];
      let habits: ReminderHabit[] = [];
      try {
        const [tasksRes, habitsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/habits"),
        ]);
        if (!tasksRes.ok || !habitsRes.ok) return;
        tasks = await tasksRes.json();
        habits = await habitsRes.json();
      } catch {
        return;
      }

      let timezone = "UTC";
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          timezone = settings?.timezone || "UTC";
        }
      } catch {
        timezone = "UTC";
      }

      const now = new Date();

      for (const task of tasks) {
        // Server computes logical due state (respects spacing + period cap).
        if (task.isDue === false) continue;
        if (isSnoozed(task, now)) continue;
        if (!isReminderTimeReached(task, now, timezone)) continue;
        if (shouldSuppressLocalReminder("task", task, timezone, now)) continue;

        await showReminderNotification(registration, "task", task);
        markLocalReminderFired("task", task.id, timezone);
      }

      for (const habit of habits) {
        if (isSnoozed(habit, now)) continue;
        if (!isReminderTimeReached(habit, now, timezone)) continue;
        if (isHabitDoneToday(habit, now, timezone)) continue;
        if (shouldSuppressLocalReminder("habit", habit, timezone, now))
          continue;

        await showReminderNotification(registration, "habit", habit);
        markLocalReminderFired("habit", habit.id, timezone);
      }
    }

    setupPush().then((registration) => {
      if (registration) {
        checkReminders(registration);
      }
    });
  }, []);

  return null;
}
