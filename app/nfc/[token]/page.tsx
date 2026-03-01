import { db } from "@/lib/db";
import { processHabitLog } from "@/lib/gamification";
import { CheckCircle, XCircle, Flame, Zap } from "lucide-react";
import Link from "next/link";

interface NfcPageProps {
  params: Promise<{ token: string }>;
}

export default async function NfcLandingPage({ params }: NfcPageProps) {
  const { token } = await params;

  const habit = await db.habit.findUnique({
    where: { nfcToken: token },
    include: { category: true },
  });

  if (!habit || !habit.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#f5f5f5]">Invalid Token</h1>
          <p className="mt-2 text-[#888888]">This NFC tag is not linked to an active habit.</p>
        </div>
      </div>
    );
  }

  // Log the habit via NFC
  const log = await db.habitLog.create({
    data: {
      habitId: habit.id,
      userId: habit.userId,
      value: 1,
      source: "NFC",
      loggedAt: new Date(),
    },
  });

  const result = await processHabitLog(habit.id, habit.userId, "NFC");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] p-6 text-center"
    >
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: `${habit.category.color}22` }}
      >
        <CheckCircle
          className="h-12 w-12"
          style={{ color: habit.category.color }}
        />
      </div>

      <p className="text-sm font-medium" style={{ color: habit.category.color }}>
        {habit.category.name}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[#f5f5f5]">{habit.name}</h1>
      <p className="mt-2 text-[#888888]">Logged via NFC</p>

      <div className="mt-8 flex items-center gap-6">
        <div className="flex items-center gap-2 rounded-xl bg-[#1c1c1c] px-4 py-3">
          <Zap className="h-5 w-5 text-[#8b5cf6]" />
          <div className="text-left">
            <p className="text-lg font-bold text-[#f5f5f5]">+{result.xpGained}</p>
            <p className="text-xs text-[#888888]">XP earned</p>
          </div>
        </div>
        {result.streak > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-[#1c1c1c] px-4 py-3">
            <Flame className="h-5 w-5 text-orange-400" />
            <div className="text-left">
              <p className="text-lg font-bold text-[#f5f5f5]">{result.streak}</p>
              <p className="text-xs text-[#888888]">day streak</p>
            </div>
          </div>
        )}
      </div>

      {result.leveledUp && (
        <div className="mt-4 rounded-xl bg-[#3b1f6e] px-6 py-3">
          <p className="font-bold text-[#8b5cf6]">Level Up! → Level {result.newLevel}</p>
        </div>
      )}

      {result.newBadges.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.newBadges.map((badge) => (
            <div key={badge} className="rounded-xl bg-[#1c1c1c] px-4 py-2">
              <p className="text-sm text-[#f5f5f5]">🏆 Badge unlocked: <strong>{badge}</strong></p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link
          href="/dashboard"
          className="rounded-xl bg-[#7c3aed] px-6 py-3 font-medium text-white hover:bg-[#8b5cf6] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      <NfcRedirect />
    </div>
  );
}

function NfcRedirect() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(() => { window.location.href = "/dashboard"; }, 5000);`,
      }}
    />
  );
}
