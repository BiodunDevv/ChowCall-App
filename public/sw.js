// ChowCall Service Worker
// Minimal passthrough SW with push notification support

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough fetch — no caching strategy
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// Handle push events from the server
self.addEventListener("push", (event) => {
  let data = { title: "ChowCall", body: "You have a new notification." };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? "/chowcall-logo.svg",
      badge: "/chowcall-logo.svg",
      tag: data.tag ?? "chowcall",
      data: { url: data.url ?? "/" },
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing window if available
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
