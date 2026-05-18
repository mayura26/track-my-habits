import { Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HabitDetailCountSection } from "@/components/habits/HabitDetailCountSection";
import { HabitDetailHero } from "@/components/habits/HabitDetailHero";
import { HabitDetailTabs } from "@/components/habits/HabitDetailTabs";
import { HabitHistorySection } from "@/components/habits/HabitHistorySection";
import { HabitImageSection } from "@/components/habits/HabitImageSection";
import { HabitResetButton } from "@/components/habits/HabitResetButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  StatGrid,
  StatItem,
  StatPanel,
  statCellClass,
} from "@/components/ui/StatPanel";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { loadHabitHistory } from "@/lib/habit-history";
import { BUCKET_LABELS, parseScheduledWeekdays } from "@/lib/task-helpers";
import { normalizeTimezone, startOfDayInTimezone } from "@/lib/timezone";
import { HabitDetailClient } from "./HabitDetailClient";

interface HabitDetailPageProps {
  params: Promise<{ id: string }>;
}

const TRACKING_LABELS: Record<string, string> = {
  BOOLEAN: "Yes / No",
  COUNT: "Count toward goal",
};

const THRESHOLD_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY_TOTAL: "Weekly total",
  ROLLING_WINDOW: "Rolling window",
};

const WEEKDAY_LABELS: Record<string, string> = {
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

function activeDaysLabel(scheduledWeekdays: string | null): string {
  const days = parseScheduledWeekdays(scheduledWeekdays);
  if (!days) return "Every day";
  return days.map((d) => WEEKDAY_LABELS[d]).join(", ");
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
      // total + undo-last-log. The history grid fetches its own 91-day
      // window independently via loadHabitHistory.
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

  const { days, stats, dailyThreshold } = await loadHabitHistory(
    habit,
    timezone,
  );

  const overview = (
    <>
      <StatPanel>
        <StatGrid columns={4}>
          <StatItem
            value={
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-[#e0a04a]" />
                {habit.currentStreak}
              </span>
            }
            label="current streak"
            className={statCellClass(4, 0)}
          />
          <StatItem
            value={
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-5 w-5 text-[#e6c48b]" />
                {habit.bestStreak}
              </span>
            }
            label="best streak"
            className={statCellClass(4, 1)}
          />
          <StatItem
            value={`${stats.completionRate}%`}
            label="completion"
            accent
            className={statCellClass(4, 2)}
          />
          <StatItem
            value={stats.completed}
            label="completed"
            className={statCellClass(4, 3)}
          />
        </StatGrid>
      </StatPanel>

      <HabitHistorySection
        habitId={habit.id}
        trackingType={habit.trackingType}
        thresholdType={habit.thresholdType}
        thresholdValue={habit.thresholdValue}
        days={days}
        stats={stats}
        dailyThreshold={dailyThreshold}
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
    </>
  );

  const settings = (
    <>
      <HabitImageSection
        habitId={habit.id}
        imageUrl={habit.imageUrl}
        imagePrompt={habit.imagePrompt}
        name={habit.name}
        categoryName={habit.category.name}
        description={habit.description}
        trackingType={habit.trackingType}
      />

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Configuration</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#b4a58a]">Tracking</dt>
              <dd className="text-[#f7f0e1]">
                {TRACKING_LABELS[habit.trackingType] ?? habit.trackingType}
              </dd>
            </div>
            <div>
              <dt className="text-[#b4a58a]">Goal type</dt>
              <dd className="text-[#f7f0e1]">
                {THRESHOLD_LABELS[habit.thresholdType] ?? habit.thresholdType}
              </dd>
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
            <div>
              <dt className="text-[#b4a58a]">Time of day</dt>
              <dd className="text-[#f7f0e1]">
                {BUCKET_LABELS[
                  (habit.bucket ?? "DAY") as keyof typeof BUCKET_LABELS
                ] ?? "Day"}
              </dd>
            </div>
            <div>
              <dt className="text-[#b4a58a]">Active days</dt>
              <dd className="text-[#f7f0e1]">
                {activeDaysLabel(habit.scheduledWeekdays)}
              </dd>
            </div>
          </dl>
          <Link href={`/habits/${id}/edit`} className="inline-block">
            <Button variant="secondary" size="sm">
              Edit habit
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-[#f7f0e1]">Start fresh</h2>
          <p className="mt-1 text-sm text-[#b4a58a]">
            Stopped for a while? Reset logs and streaks and begin again from
            today.
          </p>
        </CardHeader>
        <CardContent>
          <HabitResetButton habitId={id} />
        </CardContent>
      </Card>

      <HabitDetailClient
        habitId={id}
        nfcToken={habit.nfcToken}
        nfcValue={habit.nfcValue}
      />
    </>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <HabitDetailHero
        name={habit.name}
        description={habit.description}
        imageUrl={habit.imageUrl}
        category={{
          name: habit.category.name,
          color: habit.category.color,
          icon: habit.category.icon,
        }}
        hasNfc={Boolean(habit.nfcToken)}
        editHref={`/habits/${id}/edit`}
        deleteAction={deleteHabit}
      />

      <HabitDetailTabs overview={overview} settings={settings} />
    </div>
  );
}
