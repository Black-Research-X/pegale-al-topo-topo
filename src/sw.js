import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA Navigation fallback for offline support (including /instrucciones)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

let scheduledTimer = null;

// Show a push notification using ServiceWorkerRegistration
async function displayScoreNotification({ id, title, body, score }) {
  const tag = `pegale-al-topo-score-${id}`;
  try {
    if (self.Notification && self.Notification.permission === 'granted') {
      await self.registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        vibrate: [200, 100, 200],
        renotify: false,
        data: {
          url: '/',
          score,
          id,
        },
      });
    }
  } catch (err) {
    console.warn('SW showNotification failed:', err);
  }

  // Notify open clients that the notification fired
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of windowClients) {
    client.postMessage({
      type: 'SCORE_NOTIFICATION_DELIVERED',
      payload: { id, title, body, score },
    });
  }
}

// Listen for schedule requests from the app
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_SCORE_NOTIFICATION') {
    const { id, title, body, score, delayMs } = data.payload;
    if (scheduledTimer) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }

    const waitMs = typeof delayMs === 'number' && delayMs > 0 ? delayMs : 60000;
    scheduledTimer = setTimeout(() => {
      scheduledTimer = null;
      displayScoreNotification({ id, title, body, score });
    }, waitMs);
  } else if (data.type === 'CANCEL_SCORE_NOTIFICATION') {
    if (scheduledTimer) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }
  } else if (data.type === 'SHOW_IMMEDIATE_NOTIFICATION' && data.payload) {
    const { id, title, body, tagPrefix = 'pegale-al-topo-admin-' } = data.payload;
    const tag = `${tagPrefix}${id}`;
    if (self.Notification && self.Notification.permission === 'granted') {
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag,
          vibrate: [200, 100, 200],
          renotify: true,
          data: {
            url: '/',
            id,
            type: 'ADMIN_BROADCAST',
          },
        }).catch((err) => console.warn('SW immediate notification failed:', err))
      );
    }
  }
});

// Handle standard Web Push events
self.addEventListener('push', (event) => {
  let payload = {
    title: '¡Pégale al Topo Arcade!',
    body: '¿Listo para superar tu último puntaje?',
    score: 0,
    id: Date.now().toString(),
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(displayScoreNotification(payload));
});

// Focus or open the game when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
