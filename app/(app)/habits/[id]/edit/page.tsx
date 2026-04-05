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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[#f7f0e1]">Edit Habit</h1>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">{habit.name}</h2>
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
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
