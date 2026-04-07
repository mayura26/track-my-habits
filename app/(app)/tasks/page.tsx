import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import {
  StatGrid,
  StatItem,
  StatPanel,
  statCellClass,
} from "@/components/ui/StatPanel";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getPeriodRange, isLogicallyDue } from "@/lib/task-helpers";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const tasks = await db.task.findMany({
    where: { userId, isActive: true },
    include: { category: true },
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

        <div className="mt-6">
          <StatPanel>
            <StatGrid columns={3}>
              <StatItem
                value={tasksWithLogs.length}
                label="active"
                className={statCellClass(3, 0)}
              />
              <StatItem
                value={dueNowCount}
                label="due now"
                className={statCellClass(3, 1)}
              />
              <StatItem
                value={reminderCount}
                label={
                  reminderCount === 1
                    ? "reminder on"
                    : reminderCount === 0
                      ? "reminders"
                      : "reminders on"
                }
                className={statCellClass(3, 2)}
              />
            </StatGrid>
          </StatPanel>
        </div>
      </SectionArtwork>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="display-title text-3xl font-semibold text-[#fff7ea]">
              Your tasks
            </h2>
            <p className="mt-2 text-sm text-[#b4a58a]">
              Complete items when they are due; spacing and buckets keep the
              list honest.
            </p>
          </div>
          <TasksClient tasks={tasksWithLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
