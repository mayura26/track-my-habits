"use client";

import type { HabitCategory, Task, TaskLog } from "@prisma/client";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/tasks/TaskCard";
import { logsInPeriod } from "@/lib/task-helpers";

type TaskWithLogs = Task & { logs: TaskLog[]; category: HabitCategory | null };

interface TasksClientProps {
  tasks: TaskWithLogs[];
  timezone: string;
}

export function TasksClient({ tasks, timezone }: TasksClientProps) {
  const router = useRouter();

  function handleComplete() {
    router.refresh();
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[rgba(216,196,160,0.18)] bg-[rgba(12,17,16,0.5)] p-12 text-center">
        <p className="text-[#b4a58a]">
          No tasks yet. Create your first recurring task.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          timezone={timezone}
          periodCount={logsInPeriod(
            task.logs,
            task.frequency,
            new Date(),
            timezone,
          )}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
}
