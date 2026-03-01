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
      className={`flex items-center justify-center rounded-full bg-[#3b1f6e] font-bold text-[#8b5cf6] ${sizeClasses[size]}`}
      title={`Level ${level}`}
    >
      {level}
    </div>
  );
}

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export function AchievementCard({ name, description, icon, earned, earnedAt }: AchievementCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-[#2a2a2a] p-4 transition-colors ${
        earned ? "bg-[#141414]" : "bg-[#0d0d0d] opacity-50"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          earned ? "bg-[#3b1f6e] text-[#8b5cf6]" : "bg-[#1c1c1c] text-[#2a2a2a]"
        }`}
      >
        <Star className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-[#f5f5f5]">{name}</p>
        <p className="text-sm text-[#888888]">{description}</p>
        {earned && earnedAt && (
          <p className="mt-1 text-xs text-[#7c3aed]">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {earned && (
        <div className="ml-auto shrink-0 rounded-full bg-[#3b1f6e] px-2.5 py-0.5 text-xs text-[#8b5cf6]">
          Earned
        </div>
      )}
    </div>
  );
}
