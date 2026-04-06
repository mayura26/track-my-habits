import { Compass, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { HabitCard } from "@/components/habits/HabitCard";
import { Button } from "@/components/ui/Button";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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
      <SectionArtwork artifactId="habitsLibrary" variant="banner">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Rituals</p>
            <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea] md:text-5xl">
              Habits that stay easy to keep.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#e8dcc8] md:text-base">
              Keep the list focused, see what still needs your attention, and
              make logging feel effortless on mobile.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/categories">
              <Button variant="secondary" className="w-full sm:w-auto">
                <SlidersHorizontal className="h-4 w-4" />
                Manage categories
              </Button>
            </Link>
            <Link href="/habits/new">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[#e8dcc8]">
          <span className="display-title text-2xl font-semibold tabular-nums text-[#fff7ea]">
            {habits.length}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
            active
          </span>
          <span
            className="mx-2 text-[rgba(216,196,160,0.35)] sm:mx-3"
            aria-hidden
          >
            ·
          </span>
          <span className="display-title text-2xl font-semibold tabular-nums text-[#fff7ea]">
            {categories.length}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
            categories
          </span>
        </div>
      </SectionArtwork>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#d8c4a0]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b4a58a]">
            Filter by category
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/habits"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !params.category
                ? "border-[rgba(230,196,139,0.36)] bg-[rgba(199,154,82,0.18)] text-[#fff2d3]"
                : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] hover:text-[#f7f0e1]"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/habits?category=${cat.id}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                params.category === cat.id
                  ? "text-white"
                  : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] hover:text-[#f7f0e1]"
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
      </section>

      {habits.length === 0 ? (
        !params.category && !params.q ? (
          <SectionArtwork
            artifactId="onboardingSteps"
            variant="banner"
            dimmed
            className="border-dashed border-[rgba(216,196,160,0.22)]"
          >
            <div className="flex flex-col items-center py-8 text-center md:py-12">
              <p className="text-[#e8dcc8]">No habits yet.</p>
              <Link href="/habits/new" className="mt-4 inline-block">
                <Button>Create your first habit</Button>
              </Link>
            </div>
          </SectionArtwork>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[rgba(216,196,160,0.18)] bg-[rgba(12,17,16,0.5)] p-10 text-center md:p-12">
            <p className="text-[#b4a58a]">No habits match your filter.</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit as Parameters<typeof HabitCard>[0]["habit"]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
