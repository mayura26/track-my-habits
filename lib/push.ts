import webpush from "web-push";
import { db } from "@/lib/db";
import { signReminderActionToken } from "@/lib/reminder-action-token";

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

interface PushPayloadWithActionToken extends PushPayload {
  actionToken?: string;
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
      const notificationPayload: PushPayloadWithActionToken =
        payload.entityType && payload.entityId
          ? {
              ...payload,
              actionToken: signReminderActionToken({
                userId,
                subscriptionId: sub.id,
                entityType: payload.entityType,
                entityId: payload.entityId,
              }),
            }
          : payload;

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(notificationPayload),
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
