import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { HabitCard } from "@/components/habits/HabitCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus } from "lucide-react";

interface HabitsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  const [habits, categories] = await Promise.all([
    db.habit.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(params.category ? { categoryId: params.category } : {}),
        ...(params.q ? { name: { contains: params.q } } : {}),
      },
      include: {
        category: true,
        logs: { orderBy: { loggedAt: "desc" }, take: 30 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.habitCategory.findMany({
      where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Habits</h1>
        <Link href="/habits/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/habits"
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            !params.category
              ? "bg-[#7c3aed] text-white"
              : "bg-[#1c1c1c] text-[#888888] hover:text-[#f5f5f5]"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/habits?category=${cat.id}`}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              params.category === cat.id
                ? "text-white"
                : "bg-[#1c1c1c] text-[#888888] hover:text-[#f5f5f5]"
            }`}
            style={
              params.category === cat.id
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2a2a2a] p-12 text-center">
          <p className="text-[#888888]">
            {params.category || params.q ? "No habits match your filter." : "No habits yet."}
          </p>
          {!params.category && !params.q && (
            <Link href="/habits/new" className="mt-3 inline-block">
              <Button>Create your first habit</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit as Parameters<typeof HabitCard>[0]["habit"]} />
          ))}
        </div>
      )}
    </div>
  );
}
