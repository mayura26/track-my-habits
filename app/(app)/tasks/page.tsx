import { Plus } from "lucide-react";
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
      <SectionArtwork artifactId="tasksFlow" variant="banner">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Recurring Work</p>
            <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea] md:text-5xl">
              Tasks that fit the rhythm of the day.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#e8dcc8] md:text-base">
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

        <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[#e8dcc8]">
          <span className="display-title text-2xl font-semibold tabular-nums text-[#fff7ea]">
            {tasksWithLogs.length}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
            active
          </span>
          <span
            className="mx-2 text-[rgba(216,196,160,0.35)] sm:mx-3"
            aria-hidden
          >
            ·
          </span>
          <span className="display-title text-2xl font-semibold tabular-nums text-[#fff7ea]">
            {dueNowCount}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
            due now
          </span>
          <span
            className="mx-2 text-[rgba(216,196,160,0.35)] sm:mx-3"
            aria-hidden
          >
            ·
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
            {reminderCount > 0
              ? `${reminderCount} reminder${reminderCount === 1 ? "" : "s"}`
              : "no reminders"}
          </span>
        </div>
      </SectionArtwork>

      <TasksClient tasks={tasksWithLogs} />
    </div>
  );
}
