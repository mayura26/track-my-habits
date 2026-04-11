import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BackfillClient } from "@/components/habits/BackfillClient";
import { Card, CardContent } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { addDays, labelFor } from "@/lib/date-keys";
import { dailyThresholdDayState } from "@/lib/habit-day-state";
import { db } from "@/lib/db";
import { getLocalDateKey } from "@/lib/timezone";

export default async function BackfillPage() {
  const session = await requireAuth();
  const userId = session.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "UTC";

  // The only timezone-aware operation in this file: decide which calendar
  // date is "today" from the user's perspective.
  const todayKey = getLocalDateKey(new Date(), timezone);

  // Build the window: yesterday back through 7 days ago, chronological.
  const windowKeys: string[] = [];
  for (let i = 7; i >= 1; i--) {
    windowKeys.push(addDays(todayKey, -i));
  }
  const earliestKey = windowKeys[0];

  const habits = await db.habit.findMany({
    where: { userId, isActive: true, thresholdType: "DAILY" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // Fetch logs with a generous coarse filter on loggedAt (±2 days around the
  // window) so we don't miss any that could still belong to a window day after
  // bucketing. Then do the precise bucketing in memory with getLocalDateKey.
  const earliestMoment = new Date(`${earliestKey}T00:00:00.000Z`);
  earliestMoment.setUTCDate(earliestMoment.getUTCDate() - 2);

  const logs = await db.habitLog.findMany({
    where: {
      userId,
      habitId: { in: habits.map((h) => h.id) },
      loggedAt: { gte: earliestMoment },
    },
    select: { habitId: true, loggedAt: true, value: true, status: true },
  });

  const habitsData = habits
    .map((habit) => {
      // Clip the window to the habit's own start date (also as a date key).
      const startParts = new Date(habit.startDate);
      const habitStartKey = getLocalDateKey(startParts, timezone);
      const effectiveKeys = windowKeys.filter((k) => k >= habitStartKey);

      const completedByDate = new Map<string, number>();
      const completedLogCountByDate = new Map<string, number>();
      const failedDates = new Set<string>();
      const isCount = habit.trackingType === "COUNT";
      for (const log of logs) {
        if (log.habitId !== habit.id) continue;
        const key = getLocalDateKey(new Date(log.loggedAt), timezone);
        if (log.status === "FAILED") {
          failedDates.add(key);
        } else {
          completedByDate.set(key, (completedByDate.get(key) ?? 0) + log.value);
          if (log.status === "COMPLETED") {
            completedLogCountByDate.set(
              key,
              (completedLogCountByDate.get(key) ?? 0) + 1,
            );
          }
        }
      }

      const days = effectiveKeys.map((key) => {
        const sum = completedByDate.get(key) ?? 0;
        const completedLogCount = completedLogCountByDate.get(key) ?? 0;
        const state = dailyThresholdDayState(
          sum,
          habit.thresholdValue,
          isCount,
          failedDates.has(key),
          completedLogCount,
        );
        return {
          dateKey: key,
          label: labelFor(key),
          state,
          value: sum,
        };
      });

      return {
        id: habit.id,
        name: habit.name,
        trackingType: habit.trackingType,
        categoryName: habit.category.name,
        categoryColor: habit.category.color,
        thresholdValue: habit.thresholdValue,
        days,
        missingCount: days.filter((d) => d.state === "missing").length,
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
            For yes/no habits: tap ✓ to log or ✗ to mark failed. For numeric
            habits: tap a day to enter a value. Tap a filled chip to undo. Last 7
            days shown.
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
