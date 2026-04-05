import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[#f7f0e1]">Edit Task</h1>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Task Details</h2>
          <p className="text-sm text-[#b4a58a]">Update your recurring task</p>
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
              minGapDays: task.minGapDays,
              reminderEnabled: task.reminderEnabled,
              reminderTime: task.reminderTime ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
