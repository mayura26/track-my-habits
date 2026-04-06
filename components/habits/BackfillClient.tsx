"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

interface BackfillDay {
  date: string;
  label: string;
  isLogged: boolean;
}

interface BackfillHabit {
  id: string;
  name: string;
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
  const [optimisticDays, addOptimistic] = useOptimistic(
    habit.days,
    (current: BackfillDay[], toggleDate: string) =>
      current.map((d) =>
        d.date === toggleDate ? { ...d, isLogged: !d.isLogged } : d,
      ),
  );
  const [isPending, startTransition] = useTransition();

  const handleToggle = (day: BackfillDay) => {
    if (isPending) return;

    const dateForApi = new Date(day.date);
    dateForApi.setHours(12, 0, 0, 0);
    const isoDate = dateForApi.toISOString();

    startTransition(async () => {
      addOptimistic(day.date);

      if (day.isLogged) {
        await fetch(
          `/api/habits/${habit.id}/log?loggedAt=${encodeURIComponent(isoDate)}`,
          { method: "DELETE" },
        );
      } else {
        await fetch(`/api/habits/${habit.id}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loggedAt: isoDate,
            source: "BACKFILL",
          }),
        });
      }

      await router.refresh();
    });
  };

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
        {optimisticDays.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() =>
              handleToggle(habit.days.find((d) => d.date === day.date) ?? day)
            }
            disabled={isPending}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-[background-color,border-color,color] duration-150 active:scale-95 motion-reduce:active:scale-100 disabled:opacity-60 disabled:cursor-wait ${
              day.isLogged
                ? "border-[#7d9c73] bg-[rgba(125,156,115,0.2)] text-[#d9efcd]"
                : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#5c5348] hover:border-[rgba(230,196,139,0.3)] hover:text-[#b4a58a]"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}
