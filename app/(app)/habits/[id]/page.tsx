import { Calendar, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { HabitDetailClient } from "./HabitDetailClient";

interface HabitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HabitDetailPage({
  params,
}: HabitDetailPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id },
    include: {
      category: true,
      logs: { orderBy: { loggedAt: "desc" }, take: 50 },
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
          <div className="mb-2 flex items-center gap-2">
            <CategoryBadge
              name={habit.category.name}
              color={habit.category.color}
            />
            {habit.nfcToken && <Badge variant="info">NFC</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-[#f7f0e1]">{habit.name}</h1>
          {habit.description && (
            <p className="mt-1 text-[#b4a58a]">{habit.description}</p>
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

      {/* Recent logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#b4a58a]" />
            <h2 className="font-medium text-[#f7f0e1]">Recent Logs</h2>
          </div>
        </CardHeader>
        <CardContent>
          {habit.logs.length === 0 ? (
            <p className="text-center text-sm text-[#b4a58a]">No logs yet.</p>
          ) : (
            <div className="space-y-2">
              {habit.logs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#b4a58a]">
                    {new Date(log.loggedAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f7f0e1]">{log.value}</span>
                    {log.source === "NFC" && (
                      <Badge variant="info" className="text-xs">
                        NFC
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
