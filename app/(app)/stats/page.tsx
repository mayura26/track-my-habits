import { Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { CompletionHeatmap } from "@/components/charts/CompletionHeatmap";
import { HabitAreaChart } from "@/components/charts/HabitAreaChart";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export default async function StatsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const now = new Date();

  const [user, habits, logs] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, totalLogsCount: true },
    }),
    db.habit.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, currentStreak: true, bestStreak: true },
    }),
    db.habitLog.findMany({
      where: { userId, loggedAt: { gte: oneYearAgo } },
      select: { loggedAt: true, value: true },
      orderBy: { loggedAt: "asc" },
    }),
  ]);

  const heatmap: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.loggedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmap[key] = (heatmap[key] ?? 0) + 1;
  }

  const areaData: { date: string; count: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    areaData.push({ date: key, count: heatmap[key] ?? 0 });
  }

  const weeklyData: { week: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const count = logs.filter((l) => {
      const d = new Date(l.loggedAt);
      return d >= weekStart && d <= weekEnd;
    }).length;
    const label = `${String(weekStart.getMonth() + 1).padStart(2, "0")}/${String(weekStart.getDate()).padStart(2, "0")}`;
    weeklyData.push({ week: label, count });
  }

  const topStreak = Math.max(0, ...habits.map((h) => h.currentStreak));
  const bestEverStreak = Math.max(0, ...habits.map((h) => h.bestStreak));
  const recentWeekCount = weeklyData.at(-1)?.count ?? 0;
  const priorWeekCount = weeklyData.at(-2)?.count ?? 0;
  const momentumCopy =
    recentWeekCount > priorWeekCount
      ? "You logged more actions this week than last week."
      : recentWeekCount < priorWeekCount
        ? "Your pace dipped a little this week. A smaller daily target could help."
        : "Your pace is steady week over week.";

  return (
    <div className="space-y-6">
      <SectionArtwork
        artifactId="statsReflection"
        variant="banner"
        className="rounded-[28px] md:rounded-[32px]"
        contentClassName="p-5 md:p-8"
      >
        <div className="max-w-2xl">
          <p className="section-kicker">Progress</p>
          <h1 className="display-title mt-3 text-2xl font-semibold leading-[0.98] text-[#fff7ea] sm:text-3xl md:text-5xl">
            Patterns you can actually use.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#e8dcc8] md:text-base">
            Focus on momentum, consistency, and where your routines feel easiest
            to keep.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            icon={<Target className="h-4 w-4" />}
            label="Total logs"
            value={user?.totalLogsCount ?? 0}
            note="Everything you have shown up for so far."
          />
          <InsightCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Active habits"
            value={habits.length}
            note="The number of rituals currently in rotation."
          />
          <InsightCard
            icon={<Flame className="h-4 w-4" />}
            label="Top streak"
            value={`${topStreak}d`}
            note={`Best current run. All-time best is ${bestEverStreak}d.`}
          />
          <InsightCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Momentum"
            value={recentWeekCount}
            note={momentumCopy}
          />
        </div>
      </SectionArtwork>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Consistency map</h2>
          <p className="text-sm text-[#b4a58a]">
            Last 12 months of completed logging days
          </p>
        </CardHeader>
        <CardContent>
          <CompletionHeatmap heatmap={heatmap} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Daily rhythm</h2>
          <p className="text-sm text-[#b4a58a]">
            Your last 30 days, shown as a simple trend line.
          </p>
        </CardHeader>
        <CardContent>
          <HabitAreaChart data={areaData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Weekly momentum</h2>
          <p className="text-sm text-[#b4a58a]">
            Compare the last eight weeks at a glance.
          </p>
        </CardHeader>
        <CardContent>
          <WeeklyBarChart data={weeklyData} />
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(216,196,160,0.2)] bg-[rgba(5,9,8,0.45)] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[#d8c4a0]">{icon}</div>
      <p className="display-title mt-3 text-2xl font-semibold text-[#fff7ea] md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#8d826d] md:mt-3 md:text-sm md:leading-6">
        {note}
      </p>
    </div>
  );
}
