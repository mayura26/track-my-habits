import { Trophy } from "lucide-react";
import { AchievementCard } from "@/components/gamification/LevelBadge";
import { XPBar } from "@/components/gamification/XPBar";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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
      <h1 className="display-title text-2xl font-semibold text-[#f7f0e1]">
        Achievements
      </h1>

      <SectionArtwork artifactId="achievementsGlow" variant="banner" />

      {/* Level card */}
      {user && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[rgba(230,196,139,0.35)] bg-[rgba(199,154,82,0.2)] text-2xl font-bold text-[#f3ddb0]">
                {user.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-[#f7f0e1]">
                  Level {user.level}
                </p>
                <XPBar xp={user.xp} level={user.level} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badge progress */}
      <div className="flex items-center gap-2 text-[#b4a58a]">
        <Trophy className="h-4 w-4" />
        <span className="text-sm">
          {earnedCount} / {allBadges.length} badges earned
        </span>
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
              earned={!!earnedAt}
              earnedAt={earnedAt?.toISOString()}
            />
          );
        })}
      </div>
    </div>
  );
}
