"use client";

import type { Task, TaskLog } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/tasks/TaskCard";
import { BUCKET_LABELS, type Bucket, logsInPeriod } from "@/lib/task-helpers";

type TaskWithLogs = Task & { logs: TaskLog[] };

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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="display-title text-3xl font-semibold text-[#fff7ea]">
          Due Tasks
        </h2>
        <Link
          href="/tasks"
          className="text-xs uppercase tracking-[0.2em] text-[#e6c48b] hover:underline"
        >
          View all
        </Link>
      </div>

      {totalDue === 0 ? (
        <p className="text-sm text-[#b4a58a]">
          All caught up. Keep the rhythm going.
        </p>
      ) : (
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
    </div>
  );
}
