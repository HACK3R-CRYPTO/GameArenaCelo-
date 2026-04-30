// GameArena service worker — handles incoming web push notifications.
//
// Lifecycle:
//   - Browser registers this file via navigator.serviceWorker.register('/sw.js')
//   - When the backend pushes, the 'push' event fires here
//   - We render the notification with the payload from our backend
//   - When tapped, the 'notificationclick' event opens the app at the right URL

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "GameArena", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "GameArena";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag,                   // dedupes same-tag notifications
    data: { url: data.url || "/" },  // passed to notificationclick
    requireInteraction: !!data.requireInteraction,
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // If the app is already open, focus that window and route it
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      // Otherwise open a fresh tab
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
