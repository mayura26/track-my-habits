import { notFound } from "next/navigation";
import { HabitForm } from "@/components/habits/HabitForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

interface EditHabitPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHabitPage({ params }: EditHabitPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const [habit, categories] = await Promise.all([
    db.habit.findFirst({
      where: { id, userId: session.user.id },
    }),
    db.habitCategory.findMany({
      where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!habit) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="max-w-2xl">
        <p className="section-kicker">Edit Habit</p>
        <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
          {habit.name}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#b4a58a]">
          Adjust the ritual; streaks and history stay tied to this habit.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Details</h2>
          <p className="mt-1 text-sm text-[#b4a58a]">
            Update name, target, and how you track it.
          </p>
        </CardHeader>
        <CardContent>
          <HabitForm
            categories={categories}
            habitId={id}
            defaultValues={{
              name: habit.name,
              description: habit.description ?? undefined,
              categoryId: habit.categoryId,
              trackingType: habit.trackingType,
              thresholdType: habit.thresholdType,
              thresholdValue: habit.thresholdValue,
              thresholdWindow: habit.thresholdWindow ?? undefined,
              countIncrement: habit.countIncrement,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
