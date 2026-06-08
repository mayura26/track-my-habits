import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { NfcAutoRedirect } from "@/components/nfc/NfcAutoRedirect";
import { SectionArtwork } from "@/components/ui/SectionArtwork";
import { performReminderAction } from "@/lib/reminder-action-handler";
import { reminderActionSchema } from "@/lib/validations";

interface ReminderActionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function ReminderActionPage({
  searchParams,
}: ReminderActionPageProps) {
  const params = await searchParams;
  const parsed = reminderActionSchema.safeParse({
    entityType: getParam(params, "entityType"),
    entityId: getParam(params, "entityId"),
    action: getParam(params, "action"),
    actionToken: getParam(params, "actionToken"),
  });

  if (!parsed.success) {
    return (
      <ActionShell
        title="Invalid reminder link"
        message="This reminder action link is missing required details."
        tone="error"
      />
    );
  }

  const outcome = await performReminderAction(parsed.data);

  if (!outcome.ok) {
    const message =
      outcome.error === "unauthorized"
        ? "This reminder link is invalid or has expired."
        : "The linked habit or task could not be found.";
    return <ActionShell title="Action failed" message={message} tone="error" />;
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

      {isComplete &&
        result &&
        typeof result === "object" &&
        "xpGained" in result &&
        typeof result.xpGained === "number" &&
        result.xpGained > 0 && (
          <p className="mt-4 text-sm text-[#e6c48b]">
            +{result.xpGained} XP earned
          </p>
        )}

      <div className="mt-12">
        <Link
          href={
            entityType === "task"
              ? "/tasks"
              : entityType === "habit"
                ? "/habits"
                : entityType === "test"
                  ? "/settings"
                  : "/dashboard"
          }
          className="inline-flex rounded-full border border-[rgba(230,196,139,0.4)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] px-6 py-3 font-medium text-[#fff9ef] shadow-[0_18px_40px_rgba(130,95,45,0.25)] transition-colors hover:brightness-110"
        >
          {entityType === "test" ? "Back to Settings" : "Open App"}
        </Link>
      </div>

      <NfcAutoRedirect />
    </div>
  );
}

function ActionShell({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "error";
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
          <XCircle
            className={`h-16 w-16 ${tone === "error" ? "text-red-400" : "text-red-400"}`}
          />
          <div>
            <h1 className="text-2xl font-bold text-[#fff7ea]">{title}</h1>
            <p className="mt-2 text-sm text-[#e8dcc8]">{message}</p>
          </div>
        </div>
      </SectionArtwork>
    </div>
  );
}
