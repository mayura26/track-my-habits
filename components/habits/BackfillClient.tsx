"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type DayState = "completed" | "failed" | "missing";

interface BackfillDay {
  dateKey: string;
  label: string;
  state: DayState;
}

interface BackfillHabit {
  id: string;
  name: string;
  trackingType: string;
  categoryName: string;
  categoryColor: string;
  thresholdValue: number;
  days: BackfillDay[];
  missingCount: number;
}

interface BackfillClientProps {
  habits: BackfillHabit[];
}

export function BackfillClient({ habits }: BackfillClientProps) {
  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <BackfillHabitRow key={habit.id} habit={habit} />
      ))}
    </div>
  );
}

function BackfillHabitRow({ habit }: { habit: BackfillHabit }) {
  const router = useRouter();
  // Local copy of days so clicks reflect instantly and persist past the
  // router.refresh round-trip. useOptimistic clears its staged state when the
  // transition settles, which can race the RSC re-render and snap the UI back
  // to stale props — using useState + a sync effect avoids that race entirely.
  const [days, setDays] = useState<BackfillDay[]>(habit.days);
  useEffect(() => {
    setDays(habit.days);
  }, [habit.days]);
  const [isPending, startTransition] = useTransition();

  // Backfill operates on plain YYYY-MM-DD keys. The server derives the stored
  // loggedAt moment from the key using the user's timezone, so the client
  // never needs to think about timezones or Date objects.
  const updateLocal = (dateKey: string, next: DayState) => {
    setDays((prev) =>
      prev.map((d) => (d.dateKey === dateKey ? { ...d, state: next } : d)),
    );
  };

  const markCompleted = (day: BackfillDay) => {
    if (isPending) return;
    updateLocal(day.dateKey, "completed");
    startTransition(async () => {
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: day.dateKey, source: "BACKFILL" }),
      });
      router.refresh();
    });
  };

  const markFailed = (day: BackfillDay) => {
    if (isPending) return;
    updateLocal(day.dateKey, "failed");
    startTransition(async () => {
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: day.dateKey,
          source: "BACKFILL",
          status: "FAILED",
        }),
      });
      router.refresh();
    });
  };

  const undo = (day: BackfillDay) => {
    if (isPending) return;
    const statusQuery = day.state === "failed" ? "&status=FAILED" : "";
    updateLocal(day.dateKey, "missing");
    startTransition(async () => {
      await fetch(
        `/api/habits/${habit.id}/log?dateKey=${encodeURIComponent(day.dateKey)}${statusQuery}`,
        { method: "DELETE" },
      );
      router.refresh();
    });
  };

  const allowFail = habit.trackingType === "BOOLEAN";

  return (
    <div className="surface-panel rounded-[28px] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: habit.categoryColor }}
        >
          {habit.categoryName}
        </span>
        <span className="text-base font-semibold text-[#f7f0e1]">
          {habit.name}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {days.map((day) => {
          if (day.state === "completed") {
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => undo(day)}
                disabled={isPending}
                className="rounded-full border border-[#7d9c73] bg-[rgba(125,156,115,0.2)] px-3.5 py-2 text-xs font-semibold text-[#d9efcd] transition-[background-color,border-color,color] duration-150 active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                title="Tap to undo"
              >
                {day.label}
              </button>
            );
          }

          if (day.state === "failed") {
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => undo(day)}
                disabled={isPending}
                className="rounded-full border border-[#b66b5a] bg-[rgba(182,107,90,0.2)] px-3.5 py-2 text-xs font-semibold text-[#f1c4b8] line-through transition-[background-color,border-color,color] duration-150 active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                title="Marked failed — tap to undo"
              >
                {day.label}
              </button>
            );
          }

          // missing
          return (
            <div
              key={day.dateKey}
              className="inline-flex items-stretch overflow-hidden rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)]"
            >
              <button
                type="button"
                onClick={() => markCompleted(day)}
                disabled={isPending}
                className="px-3.5 py-2 text-xs font-semibold text-[#5c5348] transition-colors duration-150 hover:text-[#b4a58a] active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                title="Mark completed"
              >
                ✓ {day.label}
              </button>
              {allowFail && (
                <button
                  type="button"
                  onClick={() => markFailed(day)}
                  disabled={isPending}
                  aria-label={`Mark ${day.label} as failed`}
                  className="border-l border-[rgba(216,196,160,0.14)] px-2.5 py-2 text-xs font-semibold text-[#8a6257] transition-colors duration-150 hover:bg-[rgba(182,107,90,0.15)] hover:text-[#e29e8f] active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                  title="Mark failed"
                >
                  ✗
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
