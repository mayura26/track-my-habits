// Service Worker for PWA Push Notifications v4
// No fetch interception — only push + notification handling

const SW_VERSION = "4";

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

function buildReminderActions(actionUrls, singleAction) {
  if (!actionUrls?.complete) return undefined;

  const completeUrl = sameOriginUrl(actionUrls.complete);

  if (singleAction) {
    return [{ action: completeUrl, title: "Done", navigate: completeUrl }];
  }

  if (!actionUrls?.snooze) return undefined;

  const snoozeUrl = sameOriginUrl(actionUrls.snooze);

  return [
    { action: completeUrl, title: "Done", navigate: completeUrl },
    { action: snoozeUrl, title: "Snooze", navigate: snoozeUrl },
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
  const singleAction = Boolean(payload.singleAction);
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/notification-badge.png",
    data: {
      url: payload.url || "/dashboard",
      entityType: payload.entityType,
      entityId: payload.entityId,
      actionUrls,
      completeUrl: actionUrls?.complete,
      snoozeUrl: actionUrls?.snooze,
      singleAction,
      swVersion: SW_VERSION,
    },
  };

  const actions = buildReminderActions(actionUrls, singleAction);
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
    if (client.url.startsWith(self.location.origin) && "focus" in client) {
      client.navigate(sameOriginUrl(url));
      return client.focus();
    }
  }

  return clients.openWindow(sameOriginUrl(url));
}

function resolveNotificationActionTarget(action, data) {
  if (typeof action !== "string" || !action) return null;

  if (action.startsWith("http://") || action.startsWith("https://")) {
    return action;
  }

  if (action.startsWith("/reminder/")) {
    return sameOriginUrl(action);
  }

  if (action === "complete" && data.completeUrl) {
    return sameOriginUrl(data.completeUrl);
  }

  if (!data.singleAction && action === "snooze" && data.snoozeUrl) {
    return sameOriginUrl(data.snoozeUrl);
  }

  return null;
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const fallbackUrl = data.url || "/dashboard";
  const actionTarget = resolveNotificationActionTarget(event.action, data);

  if (actionTarget) {
    event.waitUntil(openAppUrl(actionTarget));
    return;
  }

  event.waitUntil(openAppUrl(fallbackUrl));
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
