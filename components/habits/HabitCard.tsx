"use client";

import Link from "next/link";
import { StreakBadge } from "./StreakBadge";
import { HabitLogButton } from "./HabitLogButton";
import { Badge } from "@/components/ui/Badge";
import type { Habit, HabitCategory, HabitLog } from "@prisma/client";

type HabitWithRelations = Habit & {
  category: HabitCategory;
  logs: HabitLog[];
};

interface HabitCardProps {
  habit: HabitWithRelations;
  onLog?: (result: unknown) => void;
}

function isLoggedToday(logs: HabitLog[], thresholdValue: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((l) => new Date(l.loggedAt) >= today);
  const todaySum = todayLogs.reduce((s, l) => s + l.value, 0);
  return todaySum >= thresholdValue;
}

export function HabitCard({ habit, onLog }: HabitCardProps) {
  const logged = isLoggedToday(habit.logs, habit.thresholdValue);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 transition-colors hover:border-[#3b1f6e]">
      <HabitLogButton habitId={habit.id} isLoggedToday={logged} onLog={onLog} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/habits/${habit.id}`}
            className="font-medium text-[#f5f5f5] hover:text-[#8b5cf6] truncate"
          >
            {habit.name}
          </Link>
          {logged && <Badge variant="success">Done</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: habit.category.color }}
          >
            {habit.category.name}
          </span>
          <span className="text-xs text-[#888888]">·</span>
          <span className="text-xs text-[#888888]">
            {habit.trackingType === "COUNT"
              ? `${habit.thresholdValue} ${habit.thresholdType.toLowerCase()}`
              : habit.thresholdType.toLowerCase()}
          </span>
        </div>
      </div>

      <StreakBadge streak={habit.currentStreak} size="sm" />

      {habit.nfcToken && (
        <Badge variant="info" className="hidden sm:inline-flex">NFC</Badge>
      )}
    </div>
  );
}
