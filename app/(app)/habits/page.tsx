import { Compass, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { HabitCardList } from "@/components/habits/HabitCardList";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import {
  StatGrid,
  StatItem,
  StatPanel,
  statCellClass,
} from "@/components/ui/StatPanel";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

interface HabitsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  const [habits, categories, user] = await Promise.all([
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
    db.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
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

        <div className="mt-6">
          <StatPanel>
            <StatGrid columns={2}>
              <StatItem
                value={habits.length}
                label="active"
                className={statCellClass(2, 0)}
              />
              <StatItem
                value={categories.length}
                label="categories"
                className={statCellClass(2, 1)}
              />
            </StatGrid>
          </StatPanel>
        </div>
      </SectionArtwork>

      <Card>
        <CardContent className="space-y-3 py-4 sm:space-y-3.5 sm:py-5">
          <div className="flex items-center gap-2">
            <Compass
              className="h-3.5 w-3.5 shrink-0 text-[#b4a58a]"
              aria-hidden
            />
            <p className="section-kicker">Filter by category</p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <Link
              href="/habits"
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:py-2 sm:text-sm ${
                !params.category
                  ? "border-[rgba(230,196,139,0.36)] bg-[rgba(199,154,82,0.18)] text-[#fff2d3]"
                  : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] hover:border-[rgba(230,196,139,0.22)] hover:text-[#f7f0e1]"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/habits?category=${cat.id}`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:py-2 sm:text-sm ${
                  params.category === cat.id
                    ? "border-transparent text-white shadow-sm"
                    : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] hover:border-[rgba(230,196,139,0.22)] hover:text-[#f7f0e1]"
                }`}
                style={
                  params.category === cat.id
                    ? { backgroundColor: cat.color }
                    : undefined
                }
              >
                <CategoryIcon icon={cat.icon} className="h-3.5 w-3.5" />
                {cat.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <Card>
            <CardContent className="py-10 text-center md:py-12">
              <p className="text-[#b4a58a]">No habits match your filter.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="display-title text-3xl font-semibold text-[#fff7ea]">
                Your habits
              </h2>
              <p className="mt-2 text-sm text-[#b4a58a]">
                Log from here or open a habit for history and step size.
              </p>
            </div>
            <HabitCardList
              className="space-y-2"
              habits={habits as Parameters<typeof HabitCardList>[0]["habits"]}
              timezone={user?.timezone ?? "UTC"}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
