import { ReminderActionView } from "@/components/reminder/ReminderActionView";
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
      <ReminderActionView outcome={{ ok: false, error: "invalid" }} />
    );
  }

  const outcome = await performReminderAction(parsed.data);
  return <ReminderActionView outcome={outcome} />;
}
