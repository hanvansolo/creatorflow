/**
 * Footy Feed service worker — handles incoming web push notifications and
 * routes notification clicks to the right URL.
 *
 * Lifecycle: skipWaiting + claim so updates take effect on the next page
 * load instead of waiting for every tab to close.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Footy Feed', body: event.data.text() };
  }

  const title = payload.title || 'Footy Feed';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/android-chrome-192x192.png',
    badge: payload.badge || '/android-chrome-192x192.png',
    image: payload.image,
    tag: payload.tag, // de-dupes notifications with the same tag
    renotify: !!payload.renotify,
    data: { url: payload.url || '/' },
    requireInteraction: !!payload.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    // If the site is already open, focus that tab and navigate.
    for (const client of allClients) {
      if ('focus' in client) {
        try {
          await client.navigate(target);
          return client.focus();
        } catch {
          // navigate() can throw cross-origin; fall through to openWindow
        }
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(target);
    }
  })());
});
