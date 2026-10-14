import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker with automatic force-update detection
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // 1. When a new Service Worker takes control, reload immediately to apply the latest build
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[PWA] New service worker took control, refreshing to apply update...');
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);

        // Immediate update check on load
        reg.update().catch(() => {});

        // Helper to prompt waiting workers to skip waiting immediately
        function monitorUpdates(registration) {
          if (registration.waiting) {
            console.log('[PWA] New worker waiting, skipping waiting...');
            registration.waiting.postMessage('skipWaiting');
          }

          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed, prompting skipWaiting...');
                installing.postMessage('skipWaiting');
              }
            });
          });
        }

        monitorUpdates(reg);

        // Periodic background update check every 30 seconds
        setInterval(() => {
          if (navigator.onLine) {
            reg.update().catch(() => {});
          }
        }, 30000);

        // Check for updates whenever the tab becomes visible/active
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
