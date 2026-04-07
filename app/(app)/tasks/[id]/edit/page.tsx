import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskImageSection } from "@/components/tasks/TaskImageSection";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { parseScheduledWeekdays } from "@/lib/task-helpers";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const task = await db.task.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="max-w-2xl">
        <p className="section-kicker">Edit Task</p>
        <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
          {task.name}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#b4a58a]">
          Change cadence, reminders, or spacing without losing completed logs.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Task details</h2>
          <p className="mt-1 text-sm text-[#b4a58a]">
            Update your recurring task.
          </p>
        </CardHeader>
        <CardContent>
          <TaskForm
            taskId={task.id}
            defaultValues={{
              name: task.name,
              description: task.description ?? undefined,
              frequency: task.frequency,
              frequencyValue: task.frequencyValue,
              bucket: task.bucket ?? "DAY",
              scheduledWeekdays:
                parseScheduledWeekdays(task.scheduledWeekdays) ?? undefined,
              minGapDays: task.minGapDays,
              reminderEnabled: task.reminderEnabled,
              reminderTime: task.reminderTime ?? undefined,
            }}
          />
        </CardContent>
      </Card>
      <TaskImageSection
        taskId={task.id}
        imageUrl={task.imageUrl}
        imagePrompt={task.imagePrompt}
        name={task.name}
        description={task.description}
        frequency={task.frequency}
        bucket={task.bucket}
      />
    </div>
  );
}
