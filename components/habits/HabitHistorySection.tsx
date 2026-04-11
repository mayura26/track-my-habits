import type { Habit } from "@prisma/client";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { addDays, weekdayIndexOf } from "@/lib/date-keys";
import { dailyThresholdDayState } from "@/lib/habit-day-state";
import { db } from "@/lib/db";
import { getLocalDateKey } from "@/lib/timezone";
import {
  type DayCell,
  HabitHistoryClient,
  type HistoryStats,
} from "./HabitHistoryClient";

// 13 weeks × 7 rows = 91 cells. Long enough for meaningful completion-rate
// stats, short enough to keep cells tappable in the detail card.
const WINDOW_WEEKS = 13;
const WINDOW_DAYS = WINDOW_WEEKS * 7;

interface HabitHistorySectionProps {
  habit: Habit;
  timezone: string;
}

export async function HabitHistorySection({
  habit,
  timezone,
}: HabitHistorySectionProps) {
  const todayKey = getLocalDateKey(new Date(), timezone);

  // Align the rightmost column to the current week's Monday. Days after today
  // (the remainder of the current week) render as "future" cells.
  //
  // weekdayIndexOf: 0=Sun..6=Sat. Offset from Monday: Sun=6, Mon=0, Tue=1,...
  const todayIdx = weekdayIndexOf(todayKey);
  const offsetFromMonday = (todayIdx + 6) % 7;
  const thisWeekMonday = addDays(todayKey, -offsetFromMonday);
  const leadingMonday = addDays(thisWeekMonday, -(WINDOW_WEEKS - 1) * 7);

  // Generate 91 consecutive date keys from leading Monday.
  const windowKeys: string[] = [];
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    windowKeys.push(addDays(leadingMonday, i));
  }

  const habitStartKey = getLocalDateKey(new Date(habit.startDate), timezone);

  // Fetch logs with a generous ±2 day buffer around the window so timezone
  // bucketing can't miss edge-of-day rows. Same pattern as backfill/page.tsx.
  const earliestKey = windowKeys[0];
  const earliestMoment = new Date(`${earliestKey}T00:00:00.000Z`);
  earliestMoment.setUTCDate(earliestMoment.getUTCDate() - 2);

  const logs = await db.habitLog.findMany({
    where: {
      habitId: habit.id,
      loggedAt: { gte: earliestMoment },
    },
    select: { loggedAt: true, value: true, status: true },
  });

  // Bucket logs by user-local date key.
  const completedByDate = new Map<string, number>();
  const completedLogCountByDate = new Map<string, number>();
  const failedDates = new Set<string>();
  for (const log of logs) {
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

  // For non-DAILY threshold types (WEEKLY_TOTAL, ROLLING_WINDOW) a single day
  // almost never meets the threshold alone, so we render any-log-that-day as
  // "completed" to show engagement pattern. The streak/threshold math happens
  // elsewhere.
  const dailyThreshold = habit.thresholdType === "DAILY";
  const threshold = habit.thresholdValue;
  const isCount = habit.trackingType === "COUNT";

  const days: DayCell[] = windowKeys.map((key) => {
    const sum = completedByDate.get(key) ?? 0;
    const completedLogCount = completedLogCountByDate.get(key) ?? 0;
    const isToday = key === todayKey;

    let state: DayCell["state"];
    if (key > todayKey) {
      state = "future";
    } else if (key < habitStartKey) {
      state = "out-of-range";
    } else if (dailyThreshold) {
      state = dailyThresholdDayState(
        sum,
        threshold,
        isCount,
        failedDates.has(key),
        completedLogCount,
      );
    } else {
      if (sum > 0) state = "completed";
      else if (failedDates.has(key)) state = "failed";
      else state = "missing";
    }

    return {
      dateKey: key,
      weekdayIndex: weekdayIndexOf(key),
      state,
      value: sum,
      isToday,
    };
  });

  // Stats: computed over in-range past days (exclude out-of-range + future).
  const inRange = days.filter(
    (d) => d.state !== "out-of-range" && d.state !== "future",
  );
  const completed = inRange.filter((d) => d.state === "completed").length;
  const failed = inRange.filter((d) => d.state === "failed").length;
  const partial = inRange.filter((d) => d.state === "partial").length;
  const trackedDays = completed + failed + partial;
  const windowDays = inRange.length;
  const completionRate =
    windowDays > 0 ? Math.round((completed / windowDays) * 100) : 0;

  const stats: HistoryStats = {
    completionRate,
    completed,
    failed,
    partial,
    trackedDays,
    windowDays,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#b4a58a]" />
          <h2 className="font-medium text-[#f7f0e1]">History</h2>
        </div>
        <p className="mt-1 text-sm text-[#b4a58a]">
          {dailyThreshold
            ? "Tap any day to edit history. Last 13 weeks shown."
            : "Daily activity shown — overall progress reflected in the streak above. Last 13 weeks."}
        </p>
      </CardHeader>
      <CardContent>
        <HabitHistoryClient
          habitId={habit.id}
          trackingType={habit.trackingType}
          thresholdType={habit.thresholdType}
          thresholdValue={habit.thresholdValue}
          days={days}
          stats={stats}
        />
      </CardContent>
    </Card>
  );
}
