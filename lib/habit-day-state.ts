/**
 * Shared rules for classifying a calendar day for DAILY-threshold habits
 * (history grid, backfill chips). Ordering matches HabitHistorySection.
 */
export function dailyThresholdDayState(
  sum: number,
  threshold: number,
  isCount: boolean,
  failedOnDay: boolean,
  completedLogCount: number,
): "completed" | "partial" | "failed" | "missing" {
  if (sum >= threshold) return "completed";
  if (isCount && sum < threshold && completedLogCount > 0) return "partial";
  if (failedOnDay) return "failed";
  return "missing";
}
