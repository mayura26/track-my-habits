"use client";

import type { HabitCategory, Task, TaskLog } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Card, CardContent } from "@/components/ui/Card";
import { BUCKET_LABELS, type Bucket, logsInPeriod } from "@/lib/task-helpers";

type TaskWithLogs = Task & { logs: TaskLog[]; category: HabitCategory | null };

interface DueTasksSectionProps {
  grouped: Record<Bucket, TaskWithLogs[]>;
  orderedBuckets: Bucket[];
  currentBucket: Bucket;
}

export function DueTasksSection({
  grouped,
  orderedBuckets,
  currentBucket,
}: DueTasksSectionProps) {
  const router = useRouter();
  const handleComplete = () => router.refresh();

  const totalDue = orderedBuckets.reduce(
    (sum, b) => sum + grouped[b].length,
    0,
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="display-title text-3xl font-semibold text-[#fff7ea]">
              Due Tasks
            </h2>
            <p className="mt-2 text-sm text-[#b4a58a]">
              {totalDue === 0
                ? "All caught up. Keep the rhythm going."
                : "What's due now and coming up in each part of your day."}
            </p>
          </div>
          <Link
            href="/tasks"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#f3ddb0]"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {totalDue > 0 && (
          <div className="space-y-5">
            {orderedBuckets.map((bucket) => {
              const tasks = grouped[bucket];
              const isCurrent = bucket === currentBucket;
              // Hide empty non-current buckets; always render current.
              if (tasks.length === 0 && !isCurrent) return null;

              return (
                <section
                  key={bucket}
                  className={
                    isCurrent
                      ? "rounded-[28px] border border-[rgba(230,196,139,0.4)] bg-[rgba(230,196,139,0.04)] p-4"
                      : "rounded-[28px] border border-[rgba(216,196,160,0.12)] p-4"
                  }
                >
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e6c48b]">
                      {BUCKET_LABELS[bucket]}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-full bg-[rgba(230,196,139,0.18)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f3ddb0]">
                        Now
                      </span>
                    )}
                  </div>

                  {tasks.length === 0 ? (
                    <p className="text-sm text-[#8d826d]">
                      Nothing due right now.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          periodCount={logsInPeriod(task.logs, task.frequency)}
                          onComplete={handleComplete}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
