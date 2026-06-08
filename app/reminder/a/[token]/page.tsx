import { ReminderActionView } from "@/components/reminder/ReminderActionView";
import { performReminderActionFromToken } from "@/lib/reminder-action-handler";

interface ReminderTokenPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReminderTokenPage({
  params,
}: ReminderTokenPageProps) {
  const { token } = await params;
  const outcome = await performReminderActionFromToken(token);
  return <ReminderActionView outcome={outcome} />;
}
