"use client";

import { CheckCircle, Circle, Clock3, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import type { DeadlineDayStatus } from "@/lib/habit-deadline";

interface HabitLogButtonProps {
  habitId: string;
  isLoggedToday: boolean;
  deadlineStatus?: DeadlineDayStatus;
  onLog?: (result: unknown) => void;
}

function isCompletedStatus(status?: DeadlineDayStatus): boolean {
  return status === "completed";
}

function isLoggedDeadlineStatus(status?: DeadlineDayStatus): boolean {
  return status === "completed" || status === "late-failed";
}

export function HabitLogButton({
  habitId,
  isLoggedToday,
  deadlineStatus,
  onLog,
}: HabitLogButtonProps) {
  const router = useRouter();
  const [playPop, setPlayPop] = useState(false);
  const [optimisticLogged, addOptimisticLogged] = useOptimistic(
    deadlineStatus ? isLoggedDeadlineStatus(deadlineStatus) : isLoggedToday,
    (_current, next: boolean) => next,
  );
  const [optimisticDeadlineStatus, addOptimisticDeadlineStatus] = useOptimistic(
    deadlineStatus,
    (_current, next: DeadlineDayStatus | undefined) => next,
  );
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isPending) return;

    if (optimisticLogged) {
      startTransition(async () => {
        addOptimisticLogged(false);
        addOptimisticDeadlineStatus(
          optimisticDeadlineStatus === "late-failed" ? "failed" : "pending",
        );
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
      return;
    }

    const nextDeadlineStatus =
      optimisticDeadlineStatus === "failed" ? "late-failed" : "completed";
    setPlayPop(true);
    startTransition(async () => {
      addOptimisticLogged(true);
      addOptimisticDeadlineStatus(
        deadlineStatus ? nextDeadlineStatus : undefined,
      );
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
  };

  const showDeadline = Boolean(deadlineStatus);
  const showCompleted = showDeadline
    ? isCompletedStatus(optimisticDeadlineStatus)
    : optimisticLogged;
  const showFailed =
    optimisticDeadlineStatus === "failed" ||
    optimisticDeadlineStatus === "late-failed";
  const title = showDeadline
    ? showCompleted
      ? "Undo log"
      : optimisticDeadlineStatus === "late-failed"
        ? "Undo missed log"
        : optimisticDeadlineStatus === "failed"
          ? "Record missed"
          : "Log now"
    : showCompleted
      ? "Undo log"
      : "Log habit";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="rounded-lg p-1 transition-[transform,background-color] duration-150 hover:bg-[rgba(247,240,225,0.06)] active:scale-95 disabled:cursor-wait disabled:opacity-90"
      title={title}
    >
      {showCompleted ? (
        <CheckCircle
          className={`h-8 w-8 text-[#7d9c73] ${playPop ? "habit-log-check-pop" : ""}`}
          strokeWidth={2}
        />
      ) : showFailed ? (
        <XCircle className="h-8 w-8 text-[#b66b5a]" strokeWidth={2} />
      ) : showDeadline ? (
        <Clock3
          className="h-8 w-8 text-[#d8c4a0] transition-colors hover:text-[#f7f0e1]"
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
