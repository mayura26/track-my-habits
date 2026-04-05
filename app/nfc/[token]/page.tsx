import { CheckCircle, Flame, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { NfcAutoRedirect } from "@/components/nfc/NfcAutoRedirect";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { db } from "@/lib/db";
import { processHabitLog } from "@/lib/gamification";

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0c1110] px-6 py-10">
        <div className="w-full max-w-lg">
          <SectionArtwork
            artifactId="nfcTap"
            variant="card"
            dimmed={false}
            className="w-full"
          />
        </div>
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#f7f0e1]">
            Invalid Token
          </h1>
          <p className="mt-2 text-[#b4a58a]">
            This NFC tag is not linked to an active habit.
          </p>
        </div>
      </div>
    );
  }

  // Log the habit via NFC
  await db.habitLog.create({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c1110] p-6 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: `${habit.category.color}22` }}
      >
        <CheckCircle
          className="h-12 w-12"
          style={{ color: habit.category.color }}
        />
      </div>

      <p
        className="text-sm font-medium"
        style={{ color: habit.category.color }}
      >
        {habit.category.name}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[#f7f0e1]">{habit.name}</h1>
      <p className="mt-2 text-[#b4a58a]">Logged via NFC</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2 rounded-xl border border-[rgba(216,196,160,0.14)] bg-[rgba(28,38,33,0.55)] px-4 py-3">
          <Zap className="h-5 w-5 text-[#e6c48b]" />
          <div className="text-left">
            <p className="text-lg font-bold text-[#f7f0e1]">
              +{result.xpGained}
            </p>
            <p className="text-xs text-[#b4a58a]">XP earned</p>
          </div>
        </div>
        {result.streak > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-[rgba(216,196,160,0.14)] bg-[rgba(28,38,33,0.55)] px-4 py-3">
            <Flame className="h-5 w-5 text-orange-400" />
            <div className="text-left">
              <p className="text-lg font-bold text-[#f7f0e1]">
                {result.streak}
              </p>
              <p className="text-xs text-[#b4a58a]">day streak</p>
            </div>
          </div>
        )}
      </div>

      {result.leveledUp && (
        <div className="mt-4 rounded-xl border border-[rgba(230,196,139,0.28)] bg-[rgba(199,154,82,0.18)] px-6 py-3">
          <p className="font-bold text-[#f3ddb0]">
            Level Up! → Level {result.newLevel}
          </p>
        </div>
      )}

      {result.newBadges.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.newBadges.map((badge) => (
            <div
              key={badge}
              className="rounded-xl border border-[rgba(216,196,160,0.14)] bg-[rgba(28,38,33,0.55)] px-4 py-2"
            >
              <p className="text-sm text-[#f7f0e1]">
                🏆 Badge unlocked: <strong>{badge}</strong>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link
          href="/dashboard"
          className="inline-flex rounded-full border border-[rgba(230,196,139,0.4)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] px-6 py-3 font-medium text-[#fff9ef] shadow-[0_18px_40px_rgba(130,95,45,0.25)] transition-colors hover:brightness-110"
        >
          Go to Dashboard
        </Link>
      </div>

      <NfcAutoRedirect />
    </div>
  );
}
