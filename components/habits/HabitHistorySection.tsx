import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  type DayCell,
  HabitHistoryClient,
  type HistoryStats,
} from "./HabitHistoryClient";

interface HabitHistorySectionProps {
  habitId: string;
  trackingType: string;
  thresholdType: string;
  thresholdValue: number;
  days: DayCell[];
  stats: HistoryStats;
  dailyThreshold: boolean;
}

/**
 * Presentational wrapper for the 13-week history grid. The grid data + stats
 * are computed upstream by `loadHabitHistory` so the detail page can reuse
 * them for the overview stat strip.
 */
export function HabitHistorySection({
  habitId,
  trackingType,
  thresholdType,
  thresholdValue,
  days,
  stats,
  dailyThreshold,
}: HabitHistorySectionProps) {
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
          habitId={habitId}
          trackingType={trackingType}
          thresholdType={thresholdType}
          thresholdValue={thresholdValue}
          days={days}
          stats={stats}
        />
      </CardContent>
    </Card>
  );
}
