import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [user, habits, logs, badges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, totalLogsCount: true },
    }),
    db.habit.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        currentStreak: true,
        bestStreak: true,
        category: { select: { color: true, name: true } },
      },
    }),
    db.habitLog.findMany({
      where: { userId, status: "COMPLETED", loggedAt: { gte: oneYearAgo } },
      select: { loggedAt: true, value: true, habitId: true },
      orderBy: { loggedAt: "asc" },
    }),
    db.userBadge.count({ where: { userId } }),
  ]);

  // Build heatmap data (date -> count)
  const heatmap = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.loggedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmap.set(key, (heatmap.get(key) ?? 0) + 1);
  }

  // Build weekly bar data (last 8 weeks)
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

  // Build area chart data (last 30 days)
  const areaData: { date: string; count: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    areaData.push({ date: key, count: heatmap.get(key) ?? 0 });
  }

  return NextResponse.json({
    user,
    habits,
    heatmap: Object.fromEntries(heatmap),
    weeklyData,
    areaData,
    badgeCount: badges,
  });
}
