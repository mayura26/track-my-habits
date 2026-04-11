"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CountDayEditor } from "@/components/habits/CountDayEditor";
import { parseDateKey } from "@/lib/date-keys";
import { countScaleColor } from "@/lib/habit-analog-colors";

type DayState = "completed" | "failed" | "missing" | "partial";

interface BackfillDay {
  dateKey: string;
  label: string;
  state: DayState;
  value: number;
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

function formatLongDate(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function BackfillHabitRow({ habit }: { habit: BackfillHabit }) {
  const router = useRouter();
  const [days, setDays] = useState<BackfillDay[]>(habit.days);
  useEffect(() => {
    setDays(habit.days);
  }, [habit.days]);
  const [isPending, startTransition] = useTransition();
  const [editingDayKey, setEditingDayKey] = useState<string | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  const isCount = habit.trackingType === "COUNT";

  const updateLocal = (dateKey: string, next: DayState, nextValue = 0) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dateKey === dateKey ? { ...d, state: next, value: nextValue } : d,
      ),
    );
  };

  const markCompletedBoolean = (day: BackfillDay) => {
    if (isPending) return;
    updateLocal(day.dateKey, "completed", 1);
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
    updateLocal(day.dateKey, "failed", 0);
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

  const saveCount = (day: BackfillDay, value: number) => {
    if (isPending) return;
    if (value < 0 || !Number.isFinite(value)) return;
    let nextState: DayState;
    if (value === 0) nextState = "partial";
    else if (value >= habit.thresholdValue) nextState = "completed";
    else nextState = "partial";
    updateLocal(day.dateKey, nextState, value);
    setEditingDayKey(null);
    startTransition(async () => {
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: day.dateKey,
          source: "BACKFILL",
          status: "COMPLETED",
          value,
          replace: true,
        }),
      });
      router.refresh();
    });
  };

  const undo = (day: BackfillDay) => {
    if (isPending) return;
    const statusQuery = day.state === "failed" ? "&status=FAILED" : "";
    updateLocal(day.dateKey, "missing", 0);
    startTransition(async () => {
      await fetch(
        `/api/habits/${habit.id}/log?dateKey=${encodeURIComponent(day.dateKey)}${statusQuery}`,
        { method: "DELETE" },
      );
      router.refresh();
    });
  };

  const allowFail = habit.trackingType === "BOOLEAN";

  const editingDay = editingDayKey
    ? days.find((d) => d.dateKey === editingDayKey)
    : null;

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
          if (isCount && (day.state === "completed" || day.state === "partial")) {
            const c = countScaleColor(day.value, habit.thresholdValue);
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => undo(day)}
                disabled={isPending}
                className="rounded-full px-3.5 py-2 text-xs font-semibold tabular-nums transition-[background-color,border-color,color] duration-150 active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                style={{
                  border: `1px solid ${c}`,
                  background: `color-mix(in srgb, ${c} 28%, transparent)`,
                  color: "#f7f0e1",
                }}
                title="Tap to undo"
              >
                {day.value}/{habit.thresholdValue} · {day.label}
              </button>
            );
          }

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
          if (isCount) {
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setEditingDayKey(day.dateKey)}
                disabled={isPending}
                className="rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] px-3.5 py-2 text-xs font-semibold text-[#b4a58a] transition-colors duration-150 hover:border-[rgba(230,196,139,0.35)] hover:text-[#f7f0e1] active:scale-95 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                title="Log value for this day"
              >
                Log · {day.label}
              </button>
            );
          }

          return (
            <div
              key={day.dateKey}
              className="inline-flex items-stretch overflow-hidden rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)]"
            >
              <button
                type="button"
                onClick={() => markCompletedBoolean(day)}
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

      {editingDay && isCount && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-24 backdrop-blur-sm sm:items-center sm:pb-4">
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setEditingDayKey(null)}
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="backfill-count-title"
            className="surface-panel relative w-full max-w-sm rounded-[24px] border border-[rgba(216,196,160,0.22)] px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d826d]">
                  Log day
                </p>
                <h3
                  id="backfill-count-title"
                  className="mt-1 text-lg font-semibold text-[#fff7ea]"
                >
                  {formatLongDate(editingDay.dateKey)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDayKey(null)}
                className="text-sm text-[#8d826d] hover:text-[#f7f0e1]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-5">
              <CountDayEditor
                value={editingDay.value}
                thresholdValue={habit.thresholdValue}
                isPending={isPending}
                firstButtonRef={firstButtonRef}
                onSave={(v) => saveCount(editingDay, v)}
                onClearDay={() => {}}
                onCancel={() => setEditingDayKey(null)}
                disableClear
                inputId={`backfill-count-${habit.id}-${editingDay.dateKey}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
