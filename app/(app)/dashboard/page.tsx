import {
  ArrowRight,
  CheckCircle,
  Compass,
  Flame,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { XPBar } from "@/components/gamification/XPBar";
import { HabitCard } from "@/components/habits/HabitCard";
import { DueTasksSection } from "@/components/tasks/DueTasksSection";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  BUCKETS,
  type Bucket,
  bucketOrderFromNow,
  getPeriodRange,
  isLogicallyDue,
} from "@/lib/task-helpers";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, habits, totalBadges, activeTasks] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        totalLogsCount: true,
        name: true,
        bucketMorningStart: true,
        bucketDayStart: true,
        bucketEveningStart: true,
        bucketBeforeBedStart: true,
      },
    }),
    db.habit.findMany({
      where: { userId, isActive: true },
      include: {
        category: true,
        logs: {
          where: {
            loggedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
      orderBy: { currentStreak: "desc" },
    }),
    db.userBadge.count({ where: { userId } }),
    db.task.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tasksWithLogs = await Promise.all(
    activeTasks.map(async (task) => {
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

  const dueTasks = tasksWithLogs.filter((t) => isLogicallyDue(t));

  const bucketPrefs = {
    bucketMorningStart: user?.bucketMorningStart ?? 5,
    bucketDayStart: user?.bucketDayStart ?? 11,
    bucketEveningStart: user?.bucketEveningStart ?? 17,
    bucketBeforeBedStart: user?.bucketBeforeBedStart ?? 21,
  };
  const orderedBuckets = bucketOrderFromNow(bucketPrefs);
  const currentBucket = orderedBuckets[0];
  const grouped = Object.fromEntries(
    BUCKETS.map((b) => [b, dueTasks.filter((t) => (t.bucket ?? "DAY") === b)]),
  ) as Record<Bucket, typeof dueTasks>;

  const sortedHabits = [...habits].sort((a, b) => {
    const aLogged = a.logs.reduce((s, l) => s + l.value, 0) >= a.thresholdValue;
    const bLogged = b.logs.reduce((s, l) => s + l.value, 0) >= b.thresholdValue;
    if (aLogged === bLogged) return b.currentStreak - a.currentStreak;
    return aLogged ? 1 : -1;
  });

  const completedToday = habits.filter(
    (h) => h.logs.reduce((s, l) => s + l.value, 0) >= h.thresholdValue,
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
              className="object-cover object-[center_28%]"
              sizes="(max-width: 1280px) 100vw, 1152px"
              priority
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,12,11,0.94)_0%,rgba(8,12,11,0.82)_38%,rgba(8,12,11,0.42)_62%,rgba(8,12,11,0.72)_100%)]"
              aria-hidden
            />
            <CardContent className="relative px-6 py-6 md:px-8 md:py-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <p className="section-kicker">Today</p>
                    <h1 className="display-title mt-3 text-4xl font-semibold leading-none text-[#fff7ea] md:text-6xl">
                      Good {getTimeOfDay()},{" "}
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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroMetric
                    icon={<Compass className="h-4 w-4" />}
                    label="Due now"
                    value={dueTasks.length}
                  />
                  <HeroMetric
                    icon={<CheckCircle className="h-4 w-4" />}
                    label="Done today"
                    value={`${completedToday}/${habits.length || 0}`}
                  />
                  <HeroMetric
                    icon={<Flame className="h-4 w-4" />}
                    label="Top streak"
                    value={topStreak}
                  />
                  <HeroMetric
                    icon={<Star className="h-4 w-4" />}
                    label="Level"
                    value={user?.level ?? 1}
                  />
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
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f3ddb0]"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {sortedHabits.length === 0 ? (
              <div className="overflow-hidden rounded-[28px] border border-dashed border-[rgba(216,196,160,0.18)] bg-[rgba(12,17,16,0.5)]">
                <SectionArtwork
                  artifactId="emptyStateDawn"
                  variant="banner"
                  dimmed={false}
                  className="rounded-none border-0"
                />
                <div className="border-t border-[rgba(216,196,160,0.12)] p-10 text-center md:p-12">
                  <p className="text-[#b4a58a]">No habits yet.</p>
                  <Link href="/habits/new" className="mt-3 inline-block">
                    <Button>Create your first habit</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit as Parameters<typeof HabitCard>[0]["habit"]}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent>
              {user && <XPBar xp={user.xp} level={user.level} />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<CheckCircle className="h-5 w-5 text-[#d9efcd]" />}
              label="Done Today"
              value={`${completedToday}/${habits.length}`}
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5 text-[#d8c4a0]" />}
              label="Badges"
              value={totalBadges}
            />
          </div>

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
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f3ddb0]"
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-5">
        {icon}
        <div>
          <p className="display-title text-3xl font-semibold text-[#fff7ea]">
            {value}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(216,196,160,0.16)] bg-[rgba(6,10,9,0.58)] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[#e6c48b]">
        {icon}
        <span className="text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
          {label}
        </span>
      </div>
      <p className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
        {value}
      </p>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
