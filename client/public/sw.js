const CACHE_NAME = 'bingo-pwa-v2.5.7';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/sounds/bgm-game.mp3',
  '/sounds/bgm-lobby%20and%20home.mp3'
];

// 1. Install event: Precache core assets in the background without interrupting active games
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const cachePromises = PRECACHE_ASSETS.map((url) => {
        return fetch(url, { cache: 'reload' })
          .then((res) => {
            if (res.ok) return cache.put(url, res);
          })
          .catch((err) => console.warn('[SW] Precache failed for:', url, err));
      });
      return Promise.all(cachePromises);
    })
  );
});

// 2. Activate event: Delete ALL older caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Deleting old cache version:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
      .then(() => {
        // Broadcast to all active clients that the new service worker version is now active
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_NAME });
          });
        });
      })
  );
});

// 3. Listen for skipWaiting and manual cache invalidation messages
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'clearOldCaches' || event.data?.type === 'CLEAR_OLD_CACHES') {
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    });
  }
});

// 4. Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass socket.io, non-http(s), and non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Always fetch version.json and API endpoints fresh from the network (never stale)
  if (url.pathname === '/version.json' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return new Response(JSON.stringify({ offline: true, version: CACHE_NAME }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Navigation requests: Network-First with automatic cache updating
  // When online: Fetches latest index.html and caches it.
  // When offline: Falls back to the latest cached index.html so the UI layout NEVER breaks or changes shape!
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy.clone());
              cache.put('/index.html', copy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((matched) => matched || caches.match('/index.html') || caches.match('/'));
        })
    );
    return;
  }

  // Static Assets (Vite hashed JS/CSS, images, sounds, fonts)
  // Stale-While-Revalidate with active cache updating
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 5. Web Push Notification Reception
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Bingo Online', body: event.data ? event.data.text() : 'New update in Bingo!' };
  }

  const title = data.title || 'Bingo Online';
  const pushId = data.pushId || data.id || null;
  const options = {
    body: data.body || 'Open Bingo to play now!',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/favicon.svg',
    data: {
      url: data.url || '/',
      pushId: pushId
    },
    vibrate: [200, 100, 200],
    tag: `bingo-push-${pushId || Date.now()}`
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const pushId = event.notification.data?.pushId;
  const baseUrl = event.notification.data?.url || '/';

  let targetUrl = baseUrl;
  if (pushId) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}push_ref=${encodeURIComponent(pushId)}`;

    // Immediate ping to backend to record push click
    fetch(`/api/analytics/push-click?id=${encodeURIComponent(pushId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: Date.now() })
    }).catch(() => {});
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl).catch(() => {});
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
