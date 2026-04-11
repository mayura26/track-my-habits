import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { HabitDetailCountSection } from "@/components/habits/HabitDetailCountSection";
import { HabitHistorySection } from "@/components/habits/HabitHistorySection";
import { HabitImageSection } from "@/components/habits/HabitImageSection";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { normalizeTimezone, startOfDayInTimezone } from "@/lib/timezone";
import { HabitDetailClient } from "./HabitDetailClient";

interface HabitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HabitDetailPage({
  params,
}: HabitDetailPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = normalizeTimezone(user?.timezone);
  const todayStart = startOfDayInTimezone(new Date(), timezone);

  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id },
    include: {
      category: true,
      // HabitDetailCountSection only needs today's logs for its running
      // total + undo-last-log. The new HabitHistorySection fetches its own
      // 91-day window independently.
      logs: {
        where: { loggedAt: { gte: todayStart } },
        orderBy: { loggedAt: "desc" },
      },
    },
  });

  if (!habit) notFound();

  async function deleteHabit() {
    "use server";
    const sess = await requireAuth();
    await db.habit.update({
      where: { id, userId: sess.user.id },
      data: { isActive: false },
    });
    redirect("/habits");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Habit</p>
          <h1 className="display-title mt-2 text-3xl font-semibold text-[#fff7ea] md:text-4xl">
            {habit.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CategoryBadge
              name={habit.category.name}
              color={habit.category.color}
              icon={habit.category.icon}
            />
            {habit.nfcToken && <Badge variant="info">NFC</Badge>}
          </div>
          {habit.description && (
            <p className="mt-2 text-sm leading-relaxed text-[#b4a58a]">
              {habit.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/habits/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <form action={deleteHabit}>
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <StreakBadge streak={habit.currentStreak} />
            <p className="mt-2 text-xs text-[#b4a58a]">Current Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <StreakBadge streak={habit.bestStreak} />
            <p className="mt-2 text-xs text-[#b4a58a]">Best Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Card artwork */}
      <HabitImageSection
        habitId={habit.id}
        imageUrl={habit.imageUrl}
        imagePrompt={habit.imagePrompt}
        name={habit.name}
        categoryName={habit.category.name}
        description={habit.description}
        trackingType={habit.trackingType}
      />

      {habit.trackingType === "COUNT" && (
        <Card>
          <CardHeader>
            <h2 className="font-medium text-[#f7f0e1]">Log & step size</h2>
            <p className="mt-1 text-sm text-[#b4a58a]">
              Log progress here and choose how large each + tap is on your
              dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <HabitDetailCountSection
              habitId={habit.id}
              logs={habit.logs}
              thresholdValue={habit.thresholdValue}
              countIncrement={habit.countIncrement ?? null}
            />
          </CardContent>
        </Card>
      )}

      {/* Config */}
      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Configuration</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#b4a58a]">Tracking</dt>
              <dd className="text-[#f7f0e1]">{habit.trackingType}</dd>
            </div>
            <div>
              <dt className="text-[#b4a58a]">Goal Type</dt>
              <dd className="text-[#f7f0e1]">{habit.thresholdType}</dd>
            </div>
            <div>
              <dt className="text-[#b4a58a]">Target</dt>
              <dd className="text-[#f7f0e1]">{habit.thresholdValue}</dd>
            </div>
            {habit.thresholdWindow && (
              <div>
                <dt className="text-[#b4a58a]">Window</dt>
                <dd className="text-[#f7f0e1]">{habit.thresholdWindow} days</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* NFC */}
      <HabitDetailClient
        habitId={id}
        nfcToken={habit.nfcToken}
        nfcValue={habit.nfcValue}
      />

      {/* History */}
      <HabitHistorySection habit={habit} timezone={timezone} />
    </div>
  );
}
