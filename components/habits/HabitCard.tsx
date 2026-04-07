"use client";

import type { Habit, HabitCategory, HabitLog } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
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
    <div
      className={`relative h-39 overflow-hidden rounded-[26px] px-3 pb-3 pt-0 transition-[border-color,background-color] duration-150 hover:bg-[rgba(247,240,225,0.02)] sm:h-39 sm:px-3.5 sm:pb-3.5 sm:pt-0 ${
        logged
          ? "border border-[rgba(125,156,115,0.22)] surface-panel hover:border-[rgba(125,156,115,0.36)]"
          : "surface-panel hover:border-[rgba(230,196,139,0.3)]"
      }`}
    >
      {habit.imageUrl && (
        <>
          <Image
            src={habit.imageUrl}
            alt=""
            fill
            className="pointer-events-none z-0 object-cover section-artwork-photo-dimmed"
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
          />
          <div className="section-artwork-card-scrim" aria-hidden />
        </>
      )}

      <div className="relative z-2 flex h-full flex-col">
        <div
          className="-mx-3 habit-card-top-shade rounded-none px-3 py-2 sm:-mx-3.5 sm:px-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/habits/${habit.id}`}
              className="block min-w-0 flex-1 truncate text-base leading-tight font-bold text-text-primary hover:text-[#f3ddb0] sm:text-lg"
            >
              {habit.name}
            </Link>
            <div className="-mr-0.5 -mt-0.5 flex shrink-0 flex-col items-end gap-1">
              <span
                className="habit-card-category-badge-wrap habit-card-category-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: habit.category.color }}
              >
                <CategoryIcon icon={habit.category.icon} className="h-3 w-3" />
                {habit.category.name}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-[4rem_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-2.5 sm:gap-x-3">
          <div className="row-span-2 flex translate-x-[10px] items-center justify-center pr-1 sm:pr-1.5">
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

          <div className="min-w-0 flex items-start">
            <div className="flex min-w-0 w-full items-end justify-end gap-2">
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-right text-xs font-semibold text-[#d6c8af]">
                  {logged ? "Logged for today" : "Ready to log"}
                </span>
                <div className="inline-flex items-center rounded-full border border-[rgba(216,196,160,0.22)] bg-[rgba(247,240,225,0.08)] px-2 py-0.5 shadow-[inset_0_1px_0_rgba(255,248,232,0.08),0_4px_10px_rgba(0,0,0,0.16)]">
                  <span className="text-[10px] italic font-medium uppercase tracking-[0.12em] text-[#c4b59a]">
                    {habit.thresholdType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex items-end justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <StreakBadge streak={habit.currentStreak} size="sm" />
              {logged && <Badge variant="success">Done</Badge>}
              {habit.nfcToken && <Badge variant="info">NFC</Badge>}
            </div>
            <div className="-mb-3 -mr-3 ml-auto shrink-0 sm:-mb-3.5 sm:-mr-3.5">
              <Link
                href={`/habits/${habit.id}`}
                className="habit-card-details-dock inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8c4a0]"
              >
                Details
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
