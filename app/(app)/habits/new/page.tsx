import { HabitForm } from "@/components/habits/HabitForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export default async function NewHabitPage() {
  const session = await requireAuth();

  const categories = await db.habitCategory.findMany({
    where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="max-w-2xl">
        <p className="section-kicker">New Habit</p>
        <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
          Build a ritual you can keep.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#b4a58a]">
          Keep it simple now. You can always refine the target after it starts
          feeling real.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Habit Details</h2>
          <p className="text-sm text-[#b4a58a]">
            Configure a ritual that feels obvious to log.
          </p>
        </CardHeader>
        <CardContent>
          <HabitForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
