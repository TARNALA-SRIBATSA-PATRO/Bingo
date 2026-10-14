import React, { useEffect, useState } from 'react';
import './UpdateManager.css';

const CURRENT_APP_VERSION = '2.3.0';

export default function UpdateManager() {
  const [updatingVersion, setUpdatingVersion] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkForUpdates() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });

        if (!res.ok) return;
        const data = await res.json();

        if (data?.version && data.version !== CURRENT_APP_VERSION) {
          console.log(`[UpdateManager] New version detected: ${data.version} (current: ${CURRENT_APP_VERSION}). Force updating...`);
          if (!active) return;
          setUpdatingVersion(data.version);

          // 1. Purge all CacheStorage caches
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map(k => caches.delete(k)));
            } catch (e) {
              console.warn('[UpdateManager] Error clearing caches:', e);
            }
          }

          // 2. Trigger Service Worker update
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                if (reg.waiting) reg.waiting.postMessage('skipWaiting');
                await reg.update();
              }
            } catch (e) {
              console.warn('[UpdateManager] Error updating SW:', e);
            }
          }

          // 3. Force reload page to fetch fresh bundles
          setTimeout(() => {
            window.location.reload(true);
          }, 800);
        }
      } catch (err) {
        // Network errors or offline mode
      }
    }

    // Check immediately on load
    checkForUpdates();

    // Check periodically every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    // Check when network reconnects or tab becomes visible
    const handleOnline = () => checkForUpdates();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    // Also listen for service worker activation broadcast
    const handleMessage = (event) => {
      if (event.data?.type === 'SW_ACTIVATED') {
        const swVer = event.data.version;
        if (swVer && !swVer.includes(CURRENT_APP_VERSION)) {
          checkForUpdates();
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  if (!updatingVersion) return null;

  return (
    <div className="update-notification-toast" role="status" aria-live="polite">
      <div className="update-toast-spinner" />
      <div className="update-toast-content">
        <span className="update-toast-title">Updating Bingo...</span>
        <span className="update-toast-desc">Loading new version v{updatingVersion}</span>
      </div>
    </div>
  );
}
