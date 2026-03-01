import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { CompletionHeatmap } from "@/components/charts/CompletionHeatmap";
import { HabitAreaChart } from "@/components/charts/HabitAreaChart";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { xpForLevel } from "@/lib/gamification";

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

  // Heatmap
  const heatmap: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.loggedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmap[key] = (heatmap[key] ?? 0) + 1;
  }

  // Area chart (last 30 days)
  const areaData: { date: string; count: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    areaData.push({ date: key, count: heatmap[key] ?? 0 });
  }

  // Weekly bar (last 8 weeks)
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
  const xpProgress = user
    ? Math.round(((user.xp - xpForLevel(user.level - 1)) / (xpForLevel(user.level) - xpForLevel(user.level - 1))) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f5f5f5]">Statistics</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Logs", value: user?.totalLogsCount ?? 0 },
          { label: "Active Habits", value: habits.length },
          { label: "Top Streak", value: `${topStreak}d` },
          { label: "Best Ever", value: `${bestEverStreak}d` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-[#f5f5f5]">{value}</p>
              <p className="text-xs text-[#888888]">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f5f5f5]">Activity Heatmap</h2>
          <p className="text-sm text-[#888888]">Last 12 months</p>
        </CardHeader>
        <CardContent>
          <CompletionHeatmap heatmap={heatmap} />
        </CardContent>
      </Card>

      {/* Area chart */}
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f5f5f5]">Daily Logs (30 days)</h2>
        </CardHeader>
        <CardContent>
          <HabitAreaChart data={areaData} />
        </CardContent>
      </Card>

      {/* Weekly bar */}
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f5f5f5]">Weekly Activity</h2>
        </CardHeader>
        <CardContent>
          <WeeklyBarChart data={weeklyData} />
        </CardContent>
      </Card>
    </div>
  );
}
