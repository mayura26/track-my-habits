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

  const handleToggle = () => {
    if (isPending) return;

    if (optimisticLogged) {
      // Undo
      startTransition(async () => {
        addOptimistic(false);
        setPlayPop(false);
        const res = await fetch(`/api/habits/${habitId}/log`, {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          onLog?.(data);
        }
        await router.refresh();
      });
    } else {
      // Log
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
          if (res.ok) {
            onLog?.(data);
          }
        } catch {
          /* network error */
        }
        await router.refresh();
      });
    }
  };

  const showDone = optimisticLogged;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="rounded-lg p-1 transition-[transform,background-color] duration-150 hover:bg-[rgba(247,240,225,0.06)] active:scale-95 disabled:cursor-wait disabled:opacity-90"
      title={showDone ? "Undo log" : "Log habit"}
    >
      {showDone ? (
        <CheckCircle
          className={`h-8 w-8 text-[#7d9c73] ${playPop ? "habit-log-check-pop" : ""}`}
          strokeWidth={2}
        />
      ) : (
        <Circle
          className="h-8 w-8 text-[#5c5348] transition-colors hover:text-text-muted"
          strokeWidth={2}
        />
      )}
    </button>
  );
}
