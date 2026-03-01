import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AchievementCard } from "@/components/gamification/LevelBadge";
import { XPBar } from "@/components/gamification/XPBar";
import { Card, CardContent } from "@/components/ui/Card";
import { Trophy } from "lucide-react";

export default async function AchievementsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, allBadges, userBadges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    }),
    db.badge.findMany({ orderBy: { name: "asc" } }),
    db.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true },
    }),
  ]);

  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));
  const earnedCount = userBadges.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f5f5f5]">Achievements</h1>

      {/* Level card */}
      {user && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#3b1f6e] text-2xl font-bold text-[#8b5cf6]">
                {user.level}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-[#f5f5f5]">Level {user.level}</p>
                <XPBar xp={user.xp} level={user.level} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badge progress */}
      <div className="flex items-center gap-2 text-[#888888]">
        <Trophy className="h-4 w-4" />
        <span className="text-sm">{earnedCount} / {allBadges.length} badges earned</span>
      </div>

      {/* All badges */}
      <div className="space-y-3">
        {allBadges.map((badge) => {
          const earnedAt = earnedMap.get(badge.id);
          return (
            <AchievementCard
              key={badge.id}
              name={badge.name}
              description={badge.description}
              icon={badge.icon}
              earned={!!earnedAt}
              earnedAt={earnedAt?.toISOString()}
            />
          );
        })}
      </div>
    </div>
  );
}
