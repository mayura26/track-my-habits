import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { HabitCard } from "@/components/habits/HabitCard";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { Flame, CheckCircle, Star, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, habits, totalBadges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, totalLogsCount: true, name: true },
    }),
    db.habit.findMany({
      where: { userId, isActive: true },
      include: {
        category: true,
        logs: {
          where: {
            loggedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
      orderBy: { currentStreak: "desc" },
    }),
    db.userBadge.count({ where: { userId } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort: incomplete habits first
  const sortedHabits = [...habits].sort((a, b) => {
    const aLogged = a.logs.reduce((s, l) => s + l.value, 0) >= a.thresholdValue;
    const bLogged = b.logs.reduce((s, l) => s + l.value, 0) >= b.thresholdValue;
    if (aLogged === bLogged) return b.currentStreak - a.currentStreak;
    return aLogged ? 1 : -1;
  });

  const completedToday = habits.filter(
    (h) => h.logs.reduce((s, l) => s + l.value, 0) >= h.thresholdValue
  ).length;

  const topStreak = Math.max(0, ...habits.map((h) => h.currentStreak));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">
            Good {getTimeOfDay()}, {user?.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-sm text-[#888888]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/habits/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-400" />}
          label="Done Today"
          value={`${completedToday}/${habits.length}`}
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-400" />}
          label="Top Streak"
          value={topStreak}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-[#8b5cf6]" />}
          label="Level"
          value={user?.level ?? 1}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-yellow-400" />}
          label="Badges"
          value={totalBadges}
        />
      </div>

      {/* XP Bar */}
      {user && (
        <Card>
          <CardContent>
            <XPBar xp={user.xp} level={user.level} />
          </CardContent>
        </Card>
      )}

      {/* Habit list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#f5f5f5]">Today&apos;s Habits</h2>
        {sortedHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2a2a2a] p-12 text-center">
            <p className="text-[#888888]">No habits yet.</p>
            <Link href="/habits/new" className="mt-3 inline-block">
              <Button>Create your first habit</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit as Parameters<typeof HabitCard>[0]["habit"]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        {icon}
        <div>
          <p className="text-xl font-bold text-[#f5f5f5]">{value}</p>
          <p className="text-xs text-[#888888]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
