import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  if (streak === 0) return null;

  const sizeClasses = size === "sm" ? "text-xs gap-1 px-2 py-0.5" : "text-sm gap-1.5 px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
        streak >= 7
          ? "bg-orange-900/40 text-orange-400"
          : streak >= 3
          ? "bg-yellow-900/40 text-yellow-400"
          : "bg-[#2a2a2a] text-[#888888]"
      }`}
    >
      <Flame className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {streak}
    </span>
  );
}
