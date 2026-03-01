import Image from "next/image";
import { signOut } from "@/auth";
import { LogOut, User } from "lucide-react";
import type { Session } from "next-auth";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { xpForLevel } from "@/lib/gamification";

interface TopNavProps {
  session: Session;
}

export function TopNav({ session }: TopNavProps) {
  const user = session.user;
  const level = (user as { level?: number }).level ?? 1;
  const xp = (user as { xp?: number }).xp ?? 0;
  const currentLevelXP = xpForLevel(level - 1);
  const nextLevelXP = xpForLevel(level);
  const progress = Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#2a2a2a] bg-[#0d0d0d]/80 px-6 backdrop-blur">
      <div className="flex items-center gap-4 md:hidden">
        <span className="font-bold text-[#f5f5f5]">Track My Habits</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#888888]">Lv.{level}</span>
          <div className="w-32">
            <ProgressBar value={progress} size="sm" />
          </div>
          <span className="text-xs text-[#888888]">{xp} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a]">
              <User className="h-4 w-4 text-[#888888]" />
            </div>
          )}
          <span className="hidden text-sm text-[#f5f5f5] md:block">
            {user?.name ?? user?.email}
          </span>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg p-1.5 text-[#888888] hover:bg-[#1c1c1c] hover:text-[#f5f5f5] transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
