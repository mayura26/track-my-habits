"use client";

import { CheckCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

interface HabitLogButtonProps {
  habitId: string;
  isLoggedToday: boolean;
  onLog?: (result: unknown) => void;
}

export function HabitLogButton({
  habitId,
  isLoggedToday,
  onLog,
}: HabitLogButtonProps) {
  const router = useRouter();
  const [playPop, setPlayPop] = useState(false);
  const [optimisticLogged, addOptimistic] = useOptimistic(
    isLoggedToday,
    (_current, next: boolean) => next,
  );
  const [isPending, startTransition] = useTransition();

  const handleLog = () => {
    if (isPending) return;
    setPlayPop(true);
    startTransition(async () => {
      addOptimistic(true);
      try {
        const res = await fetch(`/api/habits/${habitId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "MANUAL" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return;
        }
        onLog?.(data);
        await router.refresh();
      } catch {
        /* network error — optimistic state clears when transition ends */
      }
    });
  };

  const showDone = optimisticLogged;

  return (
    <button
      type="button"
      onClick={handleLog}
      disabled={isPending}
      className="rounded-lg p-1 transition-[transform,background-color] duration-150 hover:bg-[rgba(247,240,225,0.06)] active:scale-95 disabled:cursor-wait disabled:opacity-90"
      title={showDone ? "Logged today" : "Log habit"}
    >
      {showDone ? (
        <CheckCircle
          className={`h-6 w-6 text-[#7d9c73] ${playPop ? "habit-log-check-pop" : ""}`}
          strokeWidth={2}
        />
      ) : (
        <Circle
          className="h-6 w-6 text-[#5c5348] transition-colors hover:text-[#b4a58a]"
          strokeWidth={2}
        />
      )}
    </button>
  );
}
