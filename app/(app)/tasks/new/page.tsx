import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export default async function NewTaskPage() {
  const session = await requireAuth();
  const categories = await db.habitCategory.findMany({
    where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="max-w-2xl">
        <p className="section-kicker">New Task</p>
        <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
          Set up work that returns at the right time.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#b4a58a]">
          Choose the cadence, timing, and spacing so the task feels helpful
          instead of noisy.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Task Details</h2>
          <p className="text-sm text-[#b4a58a]">
            Set up a recurring task with reminders and spacing.
          </p>
        </CardHeader>
        <CardContent>
          <TaskForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
