import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "@/auth";
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
  const progress = Math.round(
    ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100,
  );

  return (
    <header className="sticky top-0 z-20 mx-4 mt-[max(1rem,env(safe-area-inset-top,0px))] flex min-h-[72px] items-center justify-between rounded-[28px] border border-[rgba(216,196,160,0.14)] bg-[rgba(12,17,16,0.78)] px-4 py-3 shadow-[0_20px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl md:mx-8 md:mt-4 md:px-6 md:py-0">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <div className="min-w-0">
          <p className="section-kicker">Today</p>
          <span className="display-title block text-[1.15rem] font-semibold leading-tight text-[#f7f0e1] md:text-2xl">
            Track My Habits
          </span>
        </div>
        <div className="hidden items-center gap-3 rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] px-4 py-2 md:flex">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b4a58a]">
            Lv.{level}
          </span>
          <div className="w-32">
            <ProgressBar value={progress} size="sm" />
          </div>
          <span className="text-xs text-[#d8c4a0]">{xp} XP</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
        <div className="rounded-full border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] px-2.5 py-1 md:hidden">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8c4a0]">
            Lv.{level} • {progress}%
          </span>
        </div>
        <Link
          href="/settings"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-[#b4a58a] hover:bg-[rgba(247,240,225,0.05)] hover:text-[#f7f0e1] md:hidden"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(216,196,160,0.16)] bg-[rgba(247,240,225,0.05)]">
              <User className="h-4 w-4 text-[#b4a58a]" />
            </div>
          )}
          <span className="hidden text-sm text-[#f7f0e1] md:block">
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
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-[#b4a58a] hover:bg-[rgba(247,240,225,0.05)] hover:text-[#f7f0e1] md:min-h-0 md:min-w-0"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
