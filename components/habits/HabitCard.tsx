"use client";

import type { Habit, HabitCategory, HabitLog } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { HabitCountLogControl } from "./HabitCountLogControl";
import { HabitLogButton } from "./HabitLogButton";
import { StreakBadge } from "./StreakBadge";

type HabitWithRelations = Habit & {
  category: HabitCategory;
  logs: HabitLog[];
};

interface HabitCardProps {
  habit: HabitWithRelations;
  onLog?: (result: unknown) => void;
}

function todayLogsSum(logs: HabitLog[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return logs
    .filter((l) => new Date(l.loggedAt) >= today)
    .reduce((s, l) => s + l.value, 0);
}

function isLoggedToday(logs: HabitLog[], thresholdValue: number): boolean {
  return todayLogsSum(logs) >= thresholdValue;
}

export function HabitCard({ habit, onLog }: HabitCardProps) {
  const logged = isLoggedToday(habit.logs, habit.thresholdValue);
  const isCount = habit.trackingType === "COUNT";

  return (
    <div className="surface-panel flex items-stretch gap-3 rounded-[28px] p-4 transition-[border-color,background-color] duration-150 hover:border-[rgba(230,196,139,0.3)] hover:bg-[rgba(247,240,225,0.02)] sm:items-center sm:gap-4 sm:p-5">
      <div className="shrink-0 self-center">
        {isCount ? (
          <HabitCountLogControl
            habitId={habit.id}
            logs={habit.logs}
            thresholdValue={habit.thresholdValue}
            countIncrement={habit.countIncrement ?? null}
            compact
            onLog={onLog}
          />
        ) : (
          <HabitLogButton
            habitId={habit.id}
            isLoggedToday={logged}
            onLog={onLog}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: habit.category.color }}
              >
                {habit.category.name}
              </span>
              {logged && <Badge variant="success">Done</Badge>}
              {habit.nfcToken && <Badge variant="info">NFC</Badge>}
            </div>
            <Link
              href={`/habits/${habit.id}`}
              className="mt-2 block truncate text-base font-semibold text-[#f7f0e1] hover:text-[#f3ddb0] sm:text-lg"
            >
              {habit.name}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#b4a58a]">
                {habit.thresholdType.toLowerCase()}
              </span>
              <span className="text-xs text-[#8d826d]">•</span>
              <span className="text-xs text-[#8d826d]">
                {logged ? "Logged for today" : "Ready to log"}
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <StreakBadge streak={habit.currentStreak} size="sm" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between sm:hidden">
          <StreakBadge streak={habit.currentStreak} size="sm" />
          <Link
            href={`/habits/${habit.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8c4a0]"
          >
            Details
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
