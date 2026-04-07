"use client";

import type { Task } from "@prisma/client";
import { useEffect } from "react";
import {
  registerServiceWorker,
  sendSubscriptionToServer,
  subscribeToPush,
} from "@/lib/push-client";
import { isReminderDue } from "@/lib/task-helpers";
import { getLocalDateKey } from "@/lib/timezone";

type TaskWithDue = Task & { isDue?: boolean };

function getFiredKey(taskId: string, timezone: string): string {
  const today = getLocalDateKey(new Date(), timezone);
  return `reminder_fired:${taskId}:${today}`;
}

export function TaskReminderManager() {
  useEffect(() => {
    async function setupPush() {
      try {
        const registration = await registerServiceWorker();
        if (!registration) return;
        const subscription = await subscribeToPush(registration);
        if (subscription) {
          await sendSubscriptionToServer(subscription);
        }
      } catch (err) {
        console.warn("Push setup failed:", err);
      }
    }

    async function checkReminders() {
      if (!("Notification" in window)) return;

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;

      let tasks: TaskWithDue[] = [];
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) return;
        const data = await res.json();
        tasks = data;
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

      for (const task of tasks) {
        // Server computes logical due state (respects spacing + period cap).
        if (task.isDue === false) continue;
        if (!isReminderDue(task, new Date(), timezone)) continue;
        const key = getFiredKey(task.id, timezone);
        if (localStorage.getItem(key)) continue;

        new Notification(`Task reminder: ${task.name}`, {
          body: task.description ?? `Don't forget to complete this task!`,
          icon: "/web-app-manifest-192x192.png",
        });
        localStorage.setItem(key, "1");
      }
    }

    setupPush();
    checkReminders();
  }, []);

  return null;
}
