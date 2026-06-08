import { ArrowRight, Award, CalendarClock, Flame, Plus } from "lucide-react";
import Link from "next/link";
import { TodaySection } from "@/components/dashboard/TodaySection";
import { XPBar } from "@/components/gamification/XPBar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  BUCKETS,
  type Bucket,
  bucketOrderFromNow,
  getPeriodRange,
  isLogicallyDue,
  isScheduledForToday,
  logsInPeriod,
  parseScheduledWeekdays,
  WEEKDAY_ORDER,
} from "@/lib/task-helpers";
import {
  getLocalDateKey,
  getTimePartsInTimezone,
  startOfDayInTimezone,
} from "@/lib/timezone";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      name: true,
      timezone: true,
      bucketMorningStart: true,
      bucketDayStart: true,
      bucketEveningStart: true,
      bucketBeforeBedStart: true,
    },
  });
  const timezone = user?.timezone ?? "UTC";
  const now = new Date();
  const todayStart = startOfDayInTimezone(now, timezone);
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86_400_000);

  const [habits, totalBadges, activeTasks] = await Promise.all([
    db.habit.findMany({
      where: { userId, isActive: true },
      include: {
        category: true,
        logs: {
          where: {
            loggedAt: { gte: sevenDaysAgo },
          },
        },
      },
      orderBy: { currentStreak: "desc" },
    }),
    db.userBadge.count({ where: { userId } }),
    db.task.findMany({
      where: { userId, isActive: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tasksWithLogs = await Promise.all(
    activeTasks.map(async (task) => {
      const { start, end } = getPeriodRange(task.frequency, now, timezone);
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

  const dueTasks = tasksWithLogs.filter((t) =>
    isLogicallyDue(t, now, timezone),
  );

  // Today's tasks: scheduled for today and either still due or already completed
  // this period — so finished items stay visible (sunk to the bottom + dimmed).
  const todaysTasks = tasksWithLogs.filter(
    (t) =>
      isScheduledForToday(t, now, timezone) &&
      (isLogicallyDue(t, now, timezone) ||
        logsInPeriod(t.logs, t.frequency) > 0),
  );

  const bucketPrefs = {
    bucketMorningStart: user?.bucketMorningStart ?? 5,
    bucketDayStart: user?.bucketDayStart ?? 11,
    bucketEveningStart: user?.bucketEveningStart ?? 17,
    bucketBeforeBedStart: user?.bucketBeforeBedStart ?? 21,
  };
  const orderedBuckets = bucketOrderFromNow(bucketPrefs, now, timezone);
  const currentBucket = orderedBuckets[0];
  const grouped = Object.fromEntries(
    BUCKETS.map((b) => [
      b,
      todaysTasks
        .filter((t) => (t.bucket ?? "DAY") === b)
        .sort((a, c) => {
          const aDone = logsInPeriod(a.logs, a.frequency) >= a.frequencyValue;
          const cDone = logsInPeriod(c.logs, c.frequency) >= c.frequencyValue;
          if (aDone === cDone) return 0;
          return aDone ? 1 : -1;
        }),
    ]),
  ) as Record<Bucket, typeof todaysTasks>;

  function todaySum(logs: { loggedAt: Date; value: number }[]) {
    const todayKey = getLocalDateKey(now, timezone);
    return logs
      .filter(
        (l) => getLocalDateKey(new Date(l.loggedAt), timezone) === todayKey,
      )
      .reduce((s, l) => s + l.value, 0);
  }

  function isHabitDoneToday(habit: (typeof habits)[number]): boolean {
    const sum = todaySum(habit.logs);
    return habit.thresholdType === "DAILY"
      ? sum >= habit.thresholdValue
      : sum > 0;
  }

  // Habits scheduled for today — grouped by time-of-day bucket for the unified
  // "Today" view. Completed habits stay visible but sink to the bottom of their
  // bucket (dimmed), so the next outstanding action is always on top.
  const todayHabits = habits.filter((h) =>
    isScheduledForToday(h, now, timezone),
  );
  const groupedHabits = Object.fromEntries(
    BUCKETS.map((b) => [
      b,
      todayHabits
        .filter((h) => (h.bucket ?? "DAY") === b)
        .sort((a, c) => {
          const aDone = isHabitDoneToday(a);
          const cDone = isHabitDoneToday(c);
          if (aDone === cDone) return c.currentStreak - a.currentStreak;
          return aDone ? 1 : -1;
        }),
    ]),
  ) as Record<Bucket, typeof habits>;

  // Compute missing days for DAILY habits (last 7 days, excluding today)
  let totalMissingDays = 0;
  let habitsWithGaps = 0;
  for (const habit of habits) {
    if (habit.thresholdType !== "DAILY") continue;
    const startBound = new Date(
      Math.max(
        new Date(habit.startDate).setHours(0, 0, 0, 0),
        sevenDaysAgo.getTime(),
      ),
    );
    const scheduled = parseScheduledWeekdays(habit.scheduledWeekdays);
    const logsByDate = new Map<string, number>();
    for (const log of habit.logs) {
      const key = getLocalDateKey(new Date(log.loggedAt), timezone);
      logsByDate.set(key, (logsByDate.get(key) ?? 0) + log.value);
    }
    let missing = 0;
    const cursor = new Date(todayStart);
    cursor.setDate(cursor.getDate() - 1);
    while (cursor >= startBound) {
      const key = getLocalDateKey(new Date(cursor), timezone);
      const weekday =
        WEEKDAY_ORDER[getTimePartsInTimezone(cursor, timezone).weekdayIndex];
      // Non-scheduled weekdays are not expected — don't count them as missing.
      if (
        (!scheduled || scheduled.includes(weekday)) &&
        (logsByDate.get(key) ?? 0) < habit.thresholdValue
      ) {
        missing++;
      }
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    if (missing > 0) {
      totalMissingDays += missing;
      habitsWithGaps++;
    }
  }

  const completedToday = habits.filter(
    (h) => todaySum(h.logs) >= h.thresholdValue,
  ).length;
  const topStreak = Math.max(0, ...habits.map((h) => h.currentStreak));
  // Outstanding = habits scheduled today but not yet done + tasks still due.
  const outstandingCount =
    todayHabits.filter((h) => !isHabitDoneToday(h)).length + dueTasks.length;

  return (
    <div className="space-y-6 md:space-y-8">
      <Card>
        <CardContent className="space-y-3 py-4 md:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="display-title text-2xl font-semibold text-[#fff7ea] md:text-3xl">
                Good {getTimeOfDay(timezone)},{" "}
                {user?.name?.split(" ")[0] ?? "there"}.
              </h1>
              <p className="mt-1 text-sm text-[#b4a58a]">
                {habits.length > 0
                  ? `${completedToday} of ${habits.length} habits done today`
                  : "No habits yet"}
                {outstandingCount > 0
                  ? ` · ${outstandingCount} left to do`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(216,196,160,0.18)] bg-[rgba(8,12,10,0.4)] px-3 py-1.5 text-sm font-semibold text-[#f7f0e1]"
                title="Top streak"
              >
                <Flame className="h-4 w-4 text-[#e6a23c]" />
                {topStreak}
              </span>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(216,196,160,0.18)] bg-[rgba(8,12,10,0.4)] px-3 py-1.5 text-sm font-semibold text-[#f7f0e1] transition-colors hover:border-[rgba(230,196,139,0.4)]"
                title="Badges"
              >
                <Award className="h-4 w-4 text-[#e6c48b]" />
                {totalBadges}
              </Link>
              <Link href="/habits/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </Link>
            </div>
          </div>
          {user && <XPBar xp={user.xp} level={user.level} />}
        </CardContent>
      </Card>

      {activeTasks.length > 0 || habits.length > 0 ? (
        <TodaySection
          groupedTasks={grouped}
          groupedHabits={groupedHabits}
          orderedBuckets={orderedBuckets}
          currentBucket={currentBucket}
          outstandingCount={outstandingCount}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center md:py-12">
            <p className="text-[#e8dcc8]">
              Nothing here yet. Add a habit or task to start your day.
            </p>
            <Link href="/habits/new" className="mt-4 inline-block">
              <Button>Create your first habit</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {totalMissingDays > 0 && (
        <Link
          href="/habits/backfill"
          className="flex items-center gap-4 rounded-[28px] border border-[rgba(230,196,139,0.28)] bg-[rgba(199,154,82,0.08)] p-4 transition-[border-color,background-color] duration-150 hover:border-[rgba(230,196,139,0.42)] hover:bg-[rgba(199,154,82,0.12)] md:p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(230,196,139,0.14)]">
            <CalendarClock className="h-5 w-5 text-[#e6c48b]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#f7f0e1]">
              {totalMissingDays} missing day
              {totalMissingDays > 1 ? "s" : ""} across {habitsWithGaps} habit
              {habitsWithGaps > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-[#b4a58a]">
              Tap to backfill your recent logs and keep streaks accurate.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#e6c48b]" />
        </Link>
      )}
    </div>
  );
}

function getTimeOfDay(timezone: string) {
  const h = getTimePartsInTimezone(new Date(), timezone).hour;
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
