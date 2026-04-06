import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BackfillClient } from "@/components/habits/BackfillClient";
import { Card, CardContent } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export default async function BackfillPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const habits = await db.habit.findMany({
    where: { userId, isActive: true, thresholdType: "DAILY" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const logs = await db.habitLog.findMany({
    where: {
      userId,
      habitId: { in: habits.map((h) => h.id) },
      loggedAt: { gte: sevenDaysAgo },
    },
    select: { habitId: true, loggedAt: true, value: true },
  });

  // Build per-habit missing-days data
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const habitsData = habits
    .map((habit) => {
      const startBound = new Date(
        Math.max(
          new Date(habit.startDate).setHours(0, 0, 0, 0),
          sevenDaysAgo.getTime(),
        ),
      );

      const habitLogs = logs.filter((l) => l.habitId === habit.id);
      const logsByDate = new Map<string, number>();
      for (const log of habitLogs) {
        const d = new Date(log.loggedAt);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString();
        logsByDate.set(key, (logsByDate.get(key) ?? 0) + log.value);
      }

      const days: {
        date: string;
        label: string;
        isLogged: boolean;
      }[] = [];

      const cursor = new Date(today);
      cursor.setDate(cursor.getDate() - 1); // start from yesterday
      while (cursor >= startBound) {
        const key = new Date(cursor).toISOString();
        const sum = logsByDate.get(key) ?? 0;
        days.push({
          date: cursor.toISOString(),
          label: `${dayLabels[cursor.getDay()]} ${cursor.getDate()}`,
          isLogged: sum >= habit.thresholdValue,
        });
        cursor.setDate(cursor.getDate() - 1);
      }

      days.reverse(); // chronological order

      return {
        id: habit.id,
        name: habit.name,
        categoryName: habit.category.name,
        categoryColor: habit.category.color,
        thresholdValue: habit.thresholdValue,
        days,
        missingCount: days.filter((d) => !d.isLogged).length,
      };
    })
    .filter((h) => h.missingCount > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#b4a58a] transition-colors hover:bg-[rgba(247,240,225,0.05)] hover:text-[#f7f0e1]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="display-title text-3xl font-semibold text-[#fff7ea] md:text-4xl">
            Fill Missing Days
          </h1>
          <p className="mt-1 text-sm text-[#b4a58a]">
            Tap a day to log it. Tap again to remove. Last 7 days shown.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6 sm:py-8">
          {habitsData.length === 0 ? (
            <div className="py-6 text-center sm:py-10">
              <p className="text-lg font-semibold text-[#f7f0e1]">
                All caught up!
              </p>
              <p className="mt-2 text-sm text-[#b4a58a]">
                No missing days in the last week.
              </p>
            </div>
          ) : (
            <BackfillClient habits={habitsData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
