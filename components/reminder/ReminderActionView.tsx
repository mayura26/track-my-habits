import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { NfcAutoRedirect } from "@/components/nfc/NfcAutoRedirect";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import type { ReminderActionEntityType } from "@/lib/reminder-action-token";
import type { ReminderActionOutcome } from "@/lib/reminder-action-handler";

interface ReminderActionViewProps {
  outcome: ReminderActionOutcome;
}

export function ReminderActionView({ outcome }: ReminderActionViewProps) {
  if (!outcome.ok) {
    const message =
      outcome.error === "unauthorized"
        ? "This reminder link is invalid or has expired."
        : outcome.error === "invalid"
          ? "This reminder action link is missing required details."
          : "The linked habit or task could not be found.";
    const title =
      outcome.error === "invalid" ? "Invalid reminder link" : "Action failed";

    return (
      <ActionShell title={title} message={message} />
    );
  }

  const { action, entityType, message, result } = outcome;
  const isComplete = action === "complete";
  const title = isComplete ? "Done" : "Snoozed";
  const defaultMessage = isComplete
    ? entityType === "task"
      ? "Task progress recorded."
      : entityType === "habit"
        ? "Habit logged."
        : "Done reached the server."
    : "Snoozed for 30 minutes.";

  const xpGained = isComplete ? getXpGainedFromResult(result) : 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c1110] p-6 text-center">
      <div
        className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
          isComplete ? "bg-green-900/20" : "bg-amber-900/20"
        }`}
      >
        {isComplete ? (
          <CheckCircle className="h-12 w-12 text-green-400" />
        ) : (
          <Clock className="h-12 w-12 text-amber-400" />
        )}
      </div>

      <h1 className="text-3xl font-bold text-[#f7f0e1]">{title}</h1>
      <p className="mt-2 max-w-md text-[#b4a58a]">
        {message ?? defaultMessage}
      </p>

      {xpGained > 0 && (
          <p className="mt-4 text-sm text-[#e6c48b]">
            +{xpGained} XP earned
          </p>
        )}

      <div className="mt-12">
        <Link
          href={getReminderActionReturnPath(entityType)}
          className="inline-flex rounded-full border border-[rgba(230,196,139,0.4)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] px-6 py-3 font-medium text-[#fff9ef] shadow-[0_18px_40px_rgba(130,95,45,0.25)] transition-colors hover:brightness-110"
        >
          {entityType === "test" ? "Back to Settings" : "Open App"}
        </Link>
      </div>

      <NfcAutoRedirect />
    </div>
  );
}

function getReminderActionReturnPath(entityType: ReminderActionEntityType) {
  if (entityType === "task") return "/tasks";
  if (entityType === "habit") return "/habits";
  if (entityType === "test") return "/settings";
  return "/dashboard";
}

function getXpGainedFromResult(result: unknown): number {
  if (!result || typeof result !== "object" || !("xpGained" in result)) {
    return 0;
  }

  const xpGained = (result as { xpGained?: unknown }).xpGained;
  return typeof xpGained === "number" ? xpGained : 0;
}

function ActionShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c1110] px-6 py-10">
      <SectionArtwork
        artifactId="nfcTap"
        variant="card"
        dimmed
        className="w-full max-w-lg"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-16 w-16 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-[#fff7ea]">{title}</h1>
            <p className="mt-2 text-sm text-[#e8dcc8]">{message}</p>
          </div>
        </div>
      </SectionArtwork>
    </div>
  );
}
