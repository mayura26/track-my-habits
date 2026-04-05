"use client";

import { useEffect } from "react";
import { isReminderDue } from "@/lib/task-helpers";
import type { Task } from "@prisma/client";

type TaskWithDue = Task & { isDue?: boolean };

function getFiredKey(taskId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `reminder_fired:${taskId}:${today}`;
}

export function TaskReminderManager() {
  useEffect(() => {
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

      for (const task of tasks) {
        // Server computes logical due state (respects spacing + period cap).
        if (task.isDue === false) continue;
        if (!isReminderDue(task)) continue;
        const key = getFiredKey(task.id);
        if (localStorage.getItem(key)) continue;

        new Notification(`Task reminder: ${task.name}`, {
          body: task.description ?? `Don't forget to complete this task!`,
          icon: "/favicon.ico",
        });
        localStorage.setItem(key, "1");
      }
    }

    checkReminders();
  }, []);

  return null;
}
