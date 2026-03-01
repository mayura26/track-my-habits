import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { HabitForm } from "@/components/habits/HabitForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default async function NewHabitPage() {
  const session = await requireAuth();

  const categories = await db.habitCategory.findMany({
    where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[#f5f5f5]">New Habit</h1>
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f5f5f5]">Habit Details</h2>
          <p className="text-sm text-[#888888]">Configure your new habit tracking goal</p>
        </CardHeader>
        <CardContent>
          <HabitForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
