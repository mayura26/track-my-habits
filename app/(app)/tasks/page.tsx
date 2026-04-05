import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getPeriodRange, isLogicallyDue } from "@/lib/task-helpers";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const tasks = await db.task.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const tasksWithLogs = await Promise.all(
    tasks.map(async (task) => {
      const { start, end } = getPeriodRange(task.frequency);
      const periodLogs = await db.taskLog.findMany({
        where: { taskId: task.id, completedAt: { gte: start, lte: end } },
        orderBy: { completedAt: "desc" },
      });
      const latest = await db.taskLog.findFirst({
        where: { taskId: task.id },
        orderBy: { completedAt: "desc" },
      });
      const logs =
        latest && !periodLogs.find((l) => l.id === latest.id)
          ? [latest, ...periodLogs]
          : periodLogs;
      return { ...task, logs };
    }),
  );

  const dueNowCount = tasksWithLogs.filter((task) =>
    isLogicallyDue(task),
  ).length;
  const reminderCount = tasksWithLogs.filter(
    (task) => task.reminderEnabled,
  ).length;

  return (
    <div className="space-y-6">
      <section className="surface-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Recurring Work</p>
            <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea] md:text-5xl">
              Tasks that fit the rhythm of the day.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#b4a58a] md:text-base">
              Keep chores visible, spaced, and easy to check off when they are
              actually due.
            </p>
          </div>

          <Link href="/tasks/new">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>

        <SectionArtwork
          artifactId="tasksFlow"
          variant="banner"
          className="mt-6"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
              Active tasks
            </p>
            <p className="display-title mt-2 text-3xl font-semibold text-[#fff7ea]">
              {tasksWithLogs.length}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
              Due now
            </p>
            <p className="display-title mt-2 text-3xl font-semibold text-[#fff7ea]">
              {dueNowCount}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] p-4">
            <div className="flex items-center gap-2 text-[#d8c4a0]">
              <Bell className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
                Reminders
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#f7f0e1]">
              {reminderCount > 0
                ? `${reminderCount} task${reminderCount === 1 ? "" : "s"} nudging you`
                : "No reminders configured yet"}
            </p>
          </div>
        </div>
      </section>

      <TasksClient tasks={tasksWithLogs} />
    </div>
  );
}
