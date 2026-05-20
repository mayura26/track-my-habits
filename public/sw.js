// Service Worker for PWA Push Notifications
// No fetch interception — only push + notification handling

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Track My Habits", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/notification-badge.png",
    data: {
      url: payload.url || "/dashboard",
      entityType: payload.entityType,
      entityId: payload.entityId,
    },
  };

  if (payload.entityType && payload.entityId) {
    options.actions = [
      { action: "complete", title: "Done" },
      { action: "snooze", title: "Snooze" },
    ];
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

async function openAppUrl(url) {
  const windowClients = await clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    if (client.url.includes(self.location.origin) && "focus" in client) {
      client.navigate(url);
      return client.focus();
    }
  }

  return clients.openWindow(url);
}

async function sendReminderAction(notification, action) {
  const data = notification.data || {};
  if (!data.entityType || !data.entityId) {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  const res = await fetch("/api/reminders/actions", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entityType: data.entityType,
      entityId: data.entityId,
      action,
    }),
  });

  if (!res.ok) {
    await openAppUrl(data.url || "/dashboard");
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  if (event.action === "complete" || event.action === "snooze") {
    event.waitUntil(sendReminderAction(event.notification, event.action));
    return;
  }

  event.waitUntil(openAppUrl(url));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true })
      .then((newSub) => {
        const json = newSub.toJSON();
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          }),
        });
      }),
  );
});
