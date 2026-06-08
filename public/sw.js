// Service Worker for PWA Push Notifications
// No fetch interception — only push + notification handling

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function sameOriginUrl(path) {
  const url = new URL(path, self.location.origin);
  if (url.origin !== self.location.origin) {
    return new URL("/dashboard", self.location.origin).toString();
  }
  return url.toString();
}

function isSameOriginClient(client) {
  return client.url.startsWith(self.location.origin);
}

function buildReminderActions(actionUrls) {
  if (!actionUrls?.complete || !actionUrls?.snooze) return undefined;

  const completeUrl = sameOriginUrl(actionUrls.complete);
  const snoozeUrl = sameOriginUrl(actionUrls.snooze);

  return [
    { action: "complete", title: "Done", navigate: completeUrl },
    { action: "snooze", title: "Snooze", navigate: snoozeUrl },
  ];
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Track My Habits", body: event.data.text() };
  }

  const actionUrls = payload.actionUrls;
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/notification-badge.png",
    data: {
      url: payload.url || "/dashboard",
      entityType: payload.entityType,
      entityId: payload.entityId,
      actionToken: payload.actionToken,
      actionUrls,
      completeUrl: actionUrls?.complete,
      snoozeUrl: actionUrls?.snooze,
    },
  };

  const actions = buildReminderActions(actionUrls);
  if (actions) {
    options.actions = actions;
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

function getReminderActionUrl(data, action) {
  const flatUrl =
    action === "complete" ? data.completeUrl : data.snoozeUrl;
  if (flatUrl) {
    return sameOriginUrl(flatUrl);
  }

  if (data.actionUrls?.[action]) {
    return sameOriginUrl(data.actionUrls[action]);
  }

  if (!data.actionToken) return null;

  const params = new URLSearchParams({
    entityType: data.entityType,
    entityId: data.entityId,
    action,
    actionToken: data.actionToken,
  });
  return sameOriginUrl(`/reminder/action?${params.toString()}`);
}

async function sendReminderAction(notification, action) {
  const data = notification.data || {};
  if (!data.entityType || !data.entityId) {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  const actionUrl = getReminderActionUrl(data, action);
  if (!actionUrl) {
    await openAppUrl(data.url || "/dashboard");
    return;
  }

  await openAppUrl(actionUrl);
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
