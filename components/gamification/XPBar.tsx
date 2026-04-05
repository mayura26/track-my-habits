import { ProgressBar } from "@/components/ui/ProgressBar";
import { xpForLevel } from "@/lib/gamification";

interface XPBarProps {
  xp: number;
  level: number;
  className?: string;
}

export function XPBar({ xp, level, className }: XPBarProps) {
  const currentLevelXP = xpForLevel(level - 1);
  const nextLevelXP = xpForLevel(level);
  const progress = Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  return (
    <div className={className}>
      <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.18em] text-[#b4a58a]">
        <span>Level {level}</span>
        <span>{xp} / {nextLevelXP} XP</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}
