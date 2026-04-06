"use client";

import type { HabitLog } from "@prisma/client";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import {
  countStepPresets,
  defaultCountStep,
  effectiveCountStep,
  formatCountAmount,
} from "@/lib/habit-count";

interface HabitCountLogControlProps {
  habitId: string;
  logs: HabitLog[];
  thresholdValue: number;
  /** Saved step; null = automatic default from goal */
  countIncrement: number | null;
  onLog?: (result: unknown) => void;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sumTodayLogs(logs: HabitLog[]): number {
  const t0 = startOfToday();
  return logs
    .filter((l) => new Date(l.loggedAt) >= t0)
    .reduce((s, l) => s + l.value, 0);
}

function latestTodayLogValue(logs: HabitLog[]): number | null {
  const t0 = startOfToday();
  const today = logs.filter((l) => new Date(l.loggedAt) >= t0);
  if (today.length === 0) return null;
  today.sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
  );
  return today[0]?.value ?? null;
}

function mergePresets(
  threshold: number,
  saved: number | null,
): { presets: number[]; autoDefault: number } {
  const autoDefault = defaultCountStep(threshold);
  const base = countStepPresets(threshold);
  const set = new Set(base);
  if (saved != null && saved >= 1 && saved <= threshold) {
    set.add(Math.round(saved * 1e6) / 1e6);
  }
  return {
    presets: [...set].sort((a, b) => a - b),
    autoDefault,
  };
}

export function HabitCountLogControl({
  habitId,
  logs,
  thresholdValue,
  countIncrement,
  onLog,
}: HabitCountLogControlProps) {
  const router = useRouter();
  const todaySum = sumTodayLogs(logs);
  const { presets, autoDefault } = mergePresets(thresholdValue, countIncrement);

  const [optimisticIncrement, addOptimisticIncrement] = useOptimistic(
    countIncrement,
    (_current, next: number | null) => next,
  );

  const effectiveStep = effectiveCountStep(thresholdValue, optimisticIncrement);

  const [optimisticSum, addOptimistic] = useOptimistic(
    todaySum,
    (current, update: { type: "add"; delta: number } | { type: "undo"; delta: number }) => {
      if (update.type === "add") return current + update.delta;
      return Math.max(0, current - update.delta);
    },
  );
  const [isPending, startTransition] = useTransition();

  const patchIncrement = (next: number | null) => {
    if (isPending) return;
    addOptimisticIncrement(next);
    startTransition(async () => {
      await fetch(`/api/habits/${habitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countIncrement: next }),
      });
      await router.refresh();
    });
  };

  const handleAdd = () => {
    if (isPending) return;
    const delta = effectiveStep;
    addOptimistic({ type: "add", delta });
    startTransition(async () => {
      try {
        const res = await fetch(`/api/habits/${habitId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "MANUAL", value: delta }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) onLog?.(data);
      } catch {
        /* network error */
      }
      await router.refresh();
    });
  };

  const handleUndo = () => {
    if (isPending) return;
    const undoDelta = latestTodayLogValue(logs);
    if (undoDelta == null || undoDelta <= 0) return;

    addOptimistic({ type: "undo", delta: undoDelta });
    startTransition(async () => {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        onLog?.(data);
      }
      await router.refresh();
    });
  };

  const canUndo = optimisticSum > 0 && !isPending;
  const thresholdLabel = formatCountAmount(thresholdValue);
  const isAutoMode = optimisticIncrement === null;
  const autoMatchesSaved =
    countIncrement != null && Math.abs(countIncrement - autoDefault) < 1e-6;

  return (
    <div className="flex min-w-[7.5rem] max-w-[10.5rem] shrink-0 flex-col items-stretch gap-2">
      <div className="text-center leading-tight">
        <p className="text-lg font-semibold tabular-nums text-[#f7f0e1]">
          {formatCountAmount(optimisticSum)}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8d826d]">
          of {thresholdLabel}
        </p>
      </div>

      <div className="flex w-full gap-1">
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="flex h-9 flex-1 items-center justify-center rounded-xl border border-[rgba(216,196,160,0.18)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] transition-[transform,background-color,border-color] duration-150 hover:border-[rgba(230,196,139,0.28)] hover:bg-[rgba(247,240,225,0.08)] hover:text-[#f7f0e1] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          title="Undo last entry today"
          aria-label="Undo last entry today"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="flex h-9 flex-1 items-center justify-center rounded-xl border border-[rgba(125,156,115,0.35)] bg-[rgba(125,156,115,0.12)] text-[#a8c49c] transition-[transform,background-color] duration-150 hover:bg-[rgba(125,156,115,0.2)] hover:text-[#d9efcd] active:scale-95 disabled:cursor-wait disabled:opacity-90"
          title={`Add ${formatCountAmount(effectiveStep)}`}
          aria-label={`Add ${formatCountAmount(effectiveStep)} toward today total`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <p className="text-center text-[9px] font-medium uppercase tracking-[0.14em] text-[#6b6358]">
        Step size
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => patchIncrement(null)}
          className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors disabled:opacity-50 ${
            isAutoMode
              ? "border-[rgba(125,156,115,0.45)] bg-[rgba(125,156,115,0.15)] text-[#d9efcd]"
              : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#8d826d] hover:border-[rgba(230,196,139,0.25)] hover:text-[#b4a58a]"
          }`}
          title={`Automatic (${formatCountAmount(autoDefault)} for this goal)`}
        >
          Auto
        </button>
        {presets.map((p) => {
          const selected =
            !isAutoMode && optimisticIncrement != null && Math.abs(optimisticIncrement - p) < 1e-6;
          const ghostAuto = isAutoMode && Math.abs(p - autoDefault) < 1e-6 && !autoMatchesSaved;
          return (
            <button
              key={p}
              type="button"
              disabled={isPending}
              onClick={() => patchIncrement(p)}
              className={`min-w-[2rem] rounded-lg border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors disabled:opacity-50 ${
                selected
                  ? "border-[rgba(125,156,115,0.45)] bg-[rgba(125,156,115,0.15)] text-[#d9efcd]"
                  : ghostAuto
                    ? "border-[rgba(216,196,160,0.22)] bg-[rgba(247,240,225,0.06)] text-[#b4a58a]"
                    : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#8d826d] hover:border-[rgba(230,196,139,0.25)] hover:text-[#b4a58a]"
              }`}
              title={
                ghostAuto
                  ? `Suggested step (${formatCountAmount(p)}); tap to save`
                  : `Add ${formatCountAmount(p)} per + tap`
              }
            >
              {formatCountAmount(p)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
