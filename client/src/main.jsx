import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Helper to determine if it is safe to apply updates immediately
function isSafeToUpdateNow() {
  const path = window.location.pathname;
  const isLobbyOrHome = path === '/' || path === '/lobby';
  const isPlaying = Boolean(
    window.__BINGO_IS_PLAYING__ ||
    path === '/game' ||
    path === '/board-setup'
  );
  return isLobbyOrHome && !isPlaying;
}

// Register Service Worker with safe update detection (only updates when in Lobby or Home)
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // 1. When a new Service Worker takes control, reload ONLY if player is in Lobby or Home
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (!isSafeToUpdateNow()) {
      console.log('[PWA] New service worker took control, but user is in game/setup. Postponing reload until user enters lobby or home.');
      window.__BINGO_PENDING_RELOAD__ = true;
      try {
        sessionStorage.setItem('bingo_pending_reload', '1');
      } catch {}
      return;
    }
    refreshing = true;
    console.log('[PWA] New service worker took control, refreshing to apply update...');
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);

        // Update check on load
        reg.update().catch(() => {});

        // Helper to prompt waiting workers only when safe in lobby or home
        function monitorUpdates(registration) {
          function maybeSkipWaiting(worker) {
            if (!worker) return;
            if (isSafeToUpdateNow()) {
              console.log('[PWA] In lobby/home, prompting skipWaiting...');
              worker.postMessage('skipWaiting');
            } else {
              console.log('[PWA] In game/setup, postponing skipWaiting until user enters lobby or home.');
              window.__BINGO_PENDING_SW__ = true;
              try {
                sessionStorage.setItem('bingo_pending_sw', '1');
              } catch {}
            }
          }

          if (registration.waiting) {
            maybeSkipWaiting(registration.waiting);
          }

          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                maybeSkipWaiting(installing);
              }
            });
          });
        }

        monitorUpdates(reg);

        // Periodic background update check every 60 seconds with jitter
        const swJitter = Math.floor(Math.random() * 20000) - 10000;
        setInterval(() => {
          if (navigator.onLine && isSafeToUpdateNow()) {
            reg.update().catch(() => {});
          }
        }, 60000 + swJitter);

        // Check for updates whenever tab becomes visible/active
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            reg.update().catch(() => {});
          }
        });

        // Check for updates as soon as internet connectivity returns
        window.addEventListener('online', () => {
          reg.update().catch(() => {});
        });
      })
      .catch((err) => {
        console.error('[PWA] ServiceWorker registration failed:', err);
      });
  });
}
