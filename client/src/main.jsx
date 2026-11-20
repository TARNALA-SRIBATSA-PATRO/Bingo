import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installPhoneLayout } from './utils/phoneLayout';
import { installGlobalErrorReporting } from './utils/clientErrors';

installPhoneLayout();
installGlobalErrorReporting();

// Low-end devices get the layout without decorative motion.
try {
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const saveData = navigator.connection && navigator.connection.saveData;
  if ((mem && mem <= 2) || (cores && cores <= 2) || saveData) document.documentElement.classList.add('lite');
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// A new service worker only takes over while the player is on the home page or
// in the lobby, so an update never reloads the page in the middle of a round.
function isSafeToUpdateNow() {
  const path = window.location.pathname;
  const isLobbyOrHome = path === '/' || path === '/lobby';
  const isPlaying = Boolean(window.__BINGO_IS_PLAYING__ || path === '/game' || path === '/board-setup');
  return isLobbyOrHome && !isPlaying;
}

if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (!isSafeToUpdateNow()) {
      window.__BINGO_PENDING_RELOAD__ = true;
      try { sessionStorage.setItem('bingo_pending_reload', '1'); } catch {}
      return;
    }
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});

        function maybeSkipWaiting(worker) {
          if (!worker) return;
          if (isSafeToUpdateNow()) {
            worker.postMessage('skipWaiting');
          } else {
            window.__BINGO_PENDING_SW__ = true;
            try { sessionStorage.setItem('bingo_pending_sw', '1'); } catch {}
          }
        }

        if (reg.waiting) maybeSkipWaiting(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              maybeSkipWaiting(installing);
            }
          });
        });

        // Check for a new version about once a minute, and whenever the tab comes back.
        const jitter = Math.floor(Math.random() * 20000) - 10000;
        setInterval(() => {
          if (navigator.onLine && isSafeToUpdateNow()) reg.update().catch(() => {});
        }, 60000 + jitter);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
        });

        window.addEventListener('online', () => {
          reg.update().catch(() => {});
        });
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}
