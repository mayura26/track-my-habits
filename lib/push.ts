import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  entityType?: "task" | "habit";
  entityId?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.warn(`Push failed for subscription ${sub.id}:`, err);
      }
    }
  }

  return sent;
}
