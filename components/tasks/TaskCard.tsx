"use client";

import type { HabitCategory, Task, TaskLog } from "@prisma/client";
import { CheckCircle, Circle, Loader2, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  BUCKET_LABELS,
  type Bucket,
  frequencyLabel,
  isLogicallyDue,
  nextDueAt,
} from "@/lib/task-helpers";

type TaskWithLogs = Task & { logs: TaskLog[]; category: HabitCategory | null };

interface TaskCardProps {
  task: TaskWithLogs;
  periodCount: number;
  timezone?: string;
  onComplete?: () => void;
}

function formatRelative(date: Date, now: Date = new Date()): string {
  const ms = date.getTime() - now.getTime();
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

export function TaskCard({
  task,
  periodCount,
  timezone = "UTC",
  onComplete,
}: TaskCardProps) {
  const router = useRouter();
  const logicallyDue = isLogicallyDue(task, new Date(), timezone);
  const next = nextDueAt(task, new Date(), timezone);
  const [optimisticCount, addOptimistic] = useOptimistic(
    periodCount,
    (current: number, delta: number) => current + delta,
  );
  const [isPending, startTransition] = useTransition();
  const [playPop, setPlayPop] = useState(false);

  const periodFull = optimisticCount >= task.frequencyValue;

  const handleToggle = () => {
    if (isPending) return;

    if (periodFull) {
      // Undo last completion
      setPlayPop(false);
      startTransition(async () => {
        addOptimistic(-1);
        await fetch(`/api/tasks/${task.id}/complete`, { method: "DELETE" });
        onComplete?.();
        await router.refresh();
      });
    } else if (logicallyDue) {
      // Complete
      setPlayPop(true);
      startTransition(async () => {
        addOptimistic(1);
        await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
        onComplete?.();
        await router.refresh();
      });
    }
  };

  const canAct = logicallyDue || periodFull;
  const bucket = (task.bucket as Bucket | null) ?? "DAY";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] p-4 transition-[border-color,background-color] duration-150 hover:bg-[rgba(247,240,225,0.02)] sm:p-5 ${
        periodFull
          ? "border border-[rgba(125,156,115,0.22)] surface-panel hover:border-[rgba(125,156,115,0.36)]"
          : "surface-panel hover:border-[rgba(230,196,139,0.3)]"
      }`}
    >
      {task.imageUrl && (
        <>
          <Image
            src={task.imageUrl}
            alt=""
            fill
            className="pointer-events-none z-0 object-cover section-artwork-photo-dimmed"
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
          />
          <div className="section-artwork-card-scrim" aria-hidden />
        </>
      )}

      <div className="relative z-[2] flex items-start gap-4 sm:items-center">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending || !canAct}
          className="mt-0.5 rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] p-2.5 transition-colors hover:bg-[rgba(247,240,225,0.08)] active:scale-90 motion-reduce:active:scale-100 disabled:cursor-not-allowed"
          title={
            periodFull
              ? "Undo completion"
              : logicallyDue
                ? "Complete task"
                : "Not yet due"
          }
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#b4a58a]" />
          ) : periodFull ? (
            <CheckCircle
              className={`h-6 w-6 text-[#e6c48b] ${playPop ? "habit-log-check-pop" : ""}`}
            />
          ) : (
            <Circle className="h-6 w-6 text-[rgba(247,240,225,0.22)] hover:text-[#b4a58a]" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[rgba(216,196,160,0.2)] bg-[rgba(8,12,10,0.4)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b4a58a]">
              {BUCKET_LABELS[bucket]}
            </span>
            {task.category && (
              <span className="rounded-full border border-[rgba(216,196,160,0.2)] bg-[rgba(8,12,10,0.4)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b4a58a]">
                {task.category.name}
              </span>
            )}
            {periodFull && <Badge variant="success">Done</Badge>}
            {!periodFull && logicallyDue && (
              <Badge variant="warning">Due</Badge>
            )}
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block truncate text-base font-semibold text-[#f7f0e1] sm:text-lg">
                {task.name}
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#b4a58a]">
                  {frequencyLabel(task.frequency, task.frequencyValue)}
                </span>
                <span className="text-xs text-[#8d826d]">•</span>
                <span className="text-xs text-[#b4a58a]">
                  {optimisticCount}/{task.frequencyValue} done
                </span>
                {!logicallyDue && !periodFull && next && (
                  <>
                    <span className="text-xs text-[#8d826d]">•</span>
                    <span className="text-xs text-[#8d826d]">
                      Next {formatRelative(next)}
                    </span>
                  </>
                )}
                {task.reminderEnabled && task.reminderTime && (
                  <>
                    <span className="text-xs text-[#8d826d]">•</span>
                    <span className="text-xs text-[#b4a58a]">
                      Reminder {task.reminderTime}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href={`/tasks/${task.id}/edit`}
              className="rounded-full p-2 text-[#b4a58a] transition-colors hover:bg-[rgba(247,240,225,0.05)] hover:text-[#f7f0e1]"
              title="Edit task"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
