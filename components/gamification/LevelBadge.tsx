import { Star } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-[rgba(230,196,139,0.35)] bg-[rgba(199,154,82,0.2)] font-bold text-[#f3ddb0] ${sizeClasses[size]}`}
      title={`Level ${level}`}
    >
      {level}
    </div>
  );
}

interface AchievementCardProps {
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export function AchievementCard({
  name,
  description,
  earned,
  earnedAt,
}: AchievementCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-[rgba(216,196,160,0.14)] p-4 transition-colors ${
        earned
          ? "bg-[rgba(28,38,33,0.55)]"
          : "bg-[rgba(8,12,10,0.35)] opacity-[0.85]"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          earned
            ? "border border-[rgba(230,196,139,0.3)] bg-[rgba(199,154,82,0.22)] text-[#e6c48b]"
            : "border border-[rgba(216,196,160,0.08)] bg-[rgba(247,240,225,0.05)] text-[#6a6358]"
        }`}
      >
        <Star className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-[#f7f0e1]">{name}</p>
        <p className="text-sm text-[#b4a58a]">{description}</p>
        {earned && earnedAt && (
          <p className="mt-1 text-xs text-[#c79a52]">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {earned && (
        <div className="ml-auto shrink-0 rounded-full border border-[rgba(230,196,139,0.28)] bg-[rgba(199,154,82,0.18)] px-2.5 py-0.5 text-xs text-[#f3ddb0]">
          Earned
        </div>
      )}
    </div>
  );
}
