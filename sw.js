// Fistbump's service worker: shows pushed notifications and opens the app where they point.
self.addEventListener('push', (event) => {
  let message = { title: 'Fistbump', body: '', link: 'inbox', unread: 0 };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    /* An empty push still deserves a gentle nudge. */
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(message.title, {
        body: message.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: message.link,
        renotify: true,
        data: { link: message.link },
      }),
      self.navigator.setAppBadge ? self.navigator.setAppBadge(message.unread).catch(() => {}) : null,
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = `/?open=${encodeURIComponent(event.notification.data?.link ?? 'inbox')}`;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        open.postMessage({ type: 'fistbump:open', link: event.notification.data?.link });
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
