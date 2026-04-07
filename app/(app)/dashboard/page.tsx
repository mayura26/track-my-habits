import { ArrowRight, CalendarClock, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { XPBar } from "@/components/gamification/XPBar";
import { HabitCardList } from "@/components/habits/HabitCardList";
import { DueTasksSection } from "@/components/tasks/DueTasksSection";
import { Button, linkButtonClassName } from "@/components/ui/Button";
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
import {
  BUCKETS,
  type Bucket,
  bucketOrderFromNow,
  getPeriodRange,
  isLogicallyDue,
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

  const bucketPrefs = {
    bucketMorningStart: user?.bucketMorningStart ?? 5,
    bucketDayStart: user?.bucketDayStart ?? 11,
    bucketEveningStart: user?.bucketEveningStart ?? 17,
    bucketBeforeBedStart: user?.bucketBeforeBedStart ?? 21,
  };
  const orderedBuckets = bucketOrderFromNow(bucketPrefs, now, timezone);
  const currentBucket = orderedBuckets[0];
  const grouped = Object.fromEntries(
    BUCKETS.map((b) => [b, dueTasks.filter((t) => (t.bucket ?? "DAY") === b)]),
  ) as Record<Bucket, typeof dueTasks>;

  function todaySum(logs: { loggedAt: Date; value: number }[]) {
    const todayKey = getLocalDateKey(now, timezone);
    return logs
      .filter(
        (l) => getLocalDateKey(new Date(l.loggedAt), timezone) === todayKey,
      )
      .reduce((s, l) => s + l.value, 0);
  }

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
      if ((logsByDate.get(key) ?? 0) < habit.thresholdValue) missing++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    if (missing > 0) {
      totalMissingDays += missing;
      habitsWithGaps++;
    }
  }

  const sortedHabits = [...habits].sort((a, b) => {
    const aLogged = todaySum(a.logs) >= a.thresholdValue;
    const bLogged = todaySum(b.logs) >= b.thresholdValue;
    if (aLogged === bLogged) return b.currentStreak - a.currentStreak;
    return aLogged ? 1 : -1;
  });

  const completedToday = habits.filter(
    (h) => todaySum(h.logs) >= h.thresholdValue,
  ).length;
  const topStreak = Math.max(0, ...habits.map((h) => h.currentStreak));

  return (
    <div className="space-y-6 md:space-y-8">
      <section>
        <Card className="overflow-hidden ring-1 ring-inset ring-[rgba(216,196,160,0.14)]">
          <div className="relative isolate min-h-[280px] md:min-h-[300px]">
            <Image
              src="/artifacts/dashboard-hero.png"
              alt=""
              fill
              className="dashboard-hero-photo object-cover object-[center_28%]"
              sizes="(max-width: 1280px) 100vw, 1152px"
              priority
            />
            <div className="dashboard-hero-scrim" aria-hidden />
            <CardContent className="relative z-[2] px-6 py-6 md:px-8 md:py-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <p className="section-kicker">Today</p>
                    <h1 className="display-title mt-3 text-4xl font-semibold leading-none text-[#fff7ea] md:text-6xl">
                      Good {getTimeOfDay(timezone)},{" "}
                      {user?.name?.split(" ")[0] ?? "there"}.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-[#e8dcc8] text-balance drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]">
                      Start with what is due now, then keep the rest of the day
                      easy to maintain.
                    </p>
                  </div>
                  <Link href="/habits/new">
                    <Button className="w-full md:w-auto">
                      <Plus className="h-4 w-4" />
                      Add a habit
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <StatPanel>
                    <StatGrid columns={4}>
                      <StatItem
                        value={dueTasks.length}
                        label="due now"
                        className={statCellClass(4, 0)}
                      />
                      <StatItem
                        value={`${completedToday}/${habits.length || 0}`}
                        label="today"
                        className={statCellClass(4, 1)}
                      />
                      <StatItem
                        value={topStreak}
                        label="top streak"
                        className={statCellClass(4, 2)}
                      />
                      <Link
                        href="/achievements"
                        className={`group rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light ${statCellClass(4, 3)}`}
                      >
                        <StatItem
                          value={totalBadges}
                          label="badges"
                          accent
                          className=""
                        />
                      </Link>
                    </StatGrid>
                  </StatPanel>
                  {user && (
                    <XPBar
                      xp={user.xp}
                      level={user.level}
                      className="max-w-md"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </section>

      {activeTasks.length > 0 && (
        <DueTasksSection
          grouped={grouped}
          orderedBuckets={orderedBuckets}
          currentBucket={currentBucket}
        />
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

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="display-title text-3xl font-semibold text-[#fff7ea]">
                  Today&apos;s Habits
                </h2>
                <p className="mt-2 text-sm text-[#b4a58a]">
                  Keep the next action obvious and the list short enough to
                  trust.
                </p>
              </div>
              <Link
                href="/habits"
                className={linkButtonClassName(
                  "subtle",
                  "sm",
                  "shrink-0 whitespace-nowrap",
                )}
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {sortedHabits.length === 0 ? (
              <SectionArtwork
                artifactId="emptyStateDawn"
                variant="banner"
                dimmed
                className="border border-dashed border-[rgba(216,196,160,0.22)]"
              >
                <div className="flex flex-col items-center py-8 text-center md:py-10">
                  <p className="text-[#e8dcc8]">No habits yet.</p>
                  <Link href="/habits/new" className="mt-4 inline-block">
                    <Button>Create your first habit</Button>
                  </Link>
                </div>
              </SectionArtwork>
            ) : (
              <HabitCardList
                className="space-y-2"
                habits={
                  sortedHabits as Parameters<typeof HabitCardList>[0]["habits"]
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card elevated>
            <CardContent className="space-y-3">
              <p className="section-kicker">Focus</p>
              <p className="text-lg font-semibold text-[#f7f0e1]">
                Consistency compounds faster than intensity.
              </p>
              <p className="text-sm leading-6 text-[#b4a58a]">
                Protect the minimum version of your routine. That is what keeps
                momentum alive.
              </p>
              <Link
                href="/stats"
                className={linkButtonClassName(
                  "subtle",
                  "sm",
                  "shrink-0 whitespace-nowrap",
                )}
              >
                Review progress
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function getTimeOfDay(timezone: string) {
  const h = getTimePartsInTimezone(new Date(), timezone).hour;
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
