// Service Worker for PWA Push Notifications
// No fetch interception — only push + notification handling

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function sameOriginUrl(path) {
  return new URL(path, self.location.origin).toString();
}

function isSameOriginClient(client) {
  return client.url.startsWith(self.location.origin);
}

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
      actionToken: payload.actionToken,
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
    if (isSameOriginClient(client) && "focus" in client) {
      client.navigate(sameOriginUrl(url));
      return client.focus();
    }
  }

  return clients.openWindow(sameOriginUrl(url));
}

async function postReminderActionMessage(data, action) {
  const windowClients = await clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    if (isSameOriginClient(client) && "postMessage" in client) {
      client.postMessage({
        type: "reminder-action-complete",
        action,
        entityType: data.entityType,
        entityId: data.entityId,
      });
    }
  }
}

async function sendReminderAction(notification, action) {
  const data = notification.data || {};
  if (!data.entityType || !data.entityId) {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  let res;
  try {
    res = await fetch(sameOriginUrl("/api/reminders/actions"), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: data.entityType,
        entityId: data.entityId,
        action,
        actionToken: data.actionToken,
      }),
    });
  } catch {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  if (!res.ok) {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  await postReminderActionMessage(data, action);
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
