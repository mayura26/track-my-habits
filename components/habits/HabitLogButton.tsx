"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";

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
  const [optimisticLogged, setOptimisticLogged] = useOptimistic(isLoggedToday);
  const [isPending, startTransition] = useTransition();

  const handleLog = () => {
    startTransition(async () => {
      setOptimisticLogged(true);
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "MANUAL" }),
      });
      const data = await res.json();
      onLog?.(data);
    });
  };

  return (
    <button
      type="button"
      onClick={handleLog}
      disabled={isPending}
      className="rounded-lg p-1 transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed"
      title={optimisticLogged ? "Logged today" : "Log habit"}
    >
      {isPending ? (
        <Loader2 className="h-6 w-6 animate-spin text-[#b4a58a]" />
      ) : optimisticLogged ? (
        <CheckCircle className="h-6 w-6 text-[#7d9c73]" />
      ) : (
        <Circle className="h-6 w-6 text-[#2a2a2a] hover:text-[#b4a58a]" />
      )}
    </button>
  );
}
