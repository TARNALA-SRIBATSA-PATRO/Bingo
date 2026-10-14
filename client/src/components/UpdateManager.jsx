import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './UpdateManager.css';

const CURRENT_APP_VERSION = '2.5.2';

export default function UpdateManager() {
  const location = useLocation();
  const { roomData } = useGame();
  const [updatingVersion, setUpdatingVersion] = useState(null);
  const [pendingVersion, setPendingVersion] = useState(() => {
    try {
      return sessionStorage.getItem('bingo_pending_version') || null;
    } catch {
      return null;
    }
  });

  const isApplyingUpdateRef = useRef(false);

  // Updates must ONLY execute when user is on Lobby (/lobby) or Home (/)
  // and is NOT actively playing, setting up board, or inside a match room.
  const isLobbyOrHome = location.pathname === '/' || location.pathname === '/lobby';
  const isPlayingOrInRoom = Boolean(
    (roomData && roomData.id) ||
    location.pathname === '/game' ||
    location.pathname === '/board-setup'
  );
  const isSafeToUpdate = Boolean(isLobbyOrHome && !isPlayingOrInRoom);

  // Synchronize global flags so service worker listeners in main.jsx know safe state
  useEffect(() => {
    window.__BINGO_SAFE_TO_UPDATE__ = isSafeToUpdate;
    window.__BINGO_IS_PLAYING__ = isPlayingOrInRoom;
  }, [isSafeToUpdate, isPlayingOrInRoom]);

  // Execute the update: purge caches, signal Service Worker skipWaiting, and reload cleanly
  const executeApplyUpdate = useCallback(async (versionToApply) => {
    if (isApplyingUpdateRef.current) return;
    isApplyingUpdateRef.current = true;
    setUpdatingVersion(versionToApply || CURRENT_APP_VERSION);

    try {
      sessionStorage.removeItem('bingo_pending_version');
      sessionStorage.removeItem('bingo_pending_reload');
      sessionStorage.removeItem('bingo_pending_sw');
    } catch {}

    // 1. Purge all CacheStorage caches
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        console.warn('[UpdateManager] Error clearing caches:', e);
      }
    }

    // 2. Trigger Service Worker update and activate waiting worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (reg.waiting) reg.waiting.postMessage('skipWaiting');
          await reg.update().catch(() => {});
        }
      } catch (e) {
        console.warn('[UpdateManager] Error updating SW:', e);
      }
    }

    // 3. Force reload page to fetch fresh bundles
    setTimeout(() => {
      window.location.reload(true);
    }, 800);
  }, []);

  // When user enters Lobby or Home, check if an update was postponed during gameplay
  useEffect(() => {
    if (!isSafeToUpdate || isApplyingUpdateRef.current) return;

    let targetVersion = pendingVersion;
    if (!targetVersion) {
      try {
        targetVersion = sessionStorage.getItem('bingo_pending_version');
      } catch {}
    }

    const hasPendingReload = Boolean(window.__BINGO_PENDING_RELOAD__);

    if (targetVersion || hasPendingReload) {
      console.log(`[UpdateManager] User entered ${location.pathname}. Starting postponed update to ${targetVersion || 'latest'}...`);
      executeApplyUpdate(targetVersion || CURRENT_APP_VERSION);
    }
  }, [isSafeToUpdate, pendingVersion, location.pathname, executeApplyUpdate]);

  // Check version.json endpoint for newer releases
  const checkForUpdates = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (isApplyingUpdateRef.current) return;

    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data?.version && data.version !== CURRENT_APP_VERSION) {
        console.log(`[UpdateManager] New version detected: ${data.version} (current: ${CURRENT_APP_VERSION})`);

        if (isSafeToUpdate) {
          console.log(`[UpdateManager] User is on ${location.pathname}. Updating now...`);
          executeApplyUpdate(data.version);
        } else {
          console.log(`[UpdateManager] User is currently in game/room (${location.pathname}). Postponing update until user enters lobby or home.`);
          setPendingVersion(data.version);
          try {
            sessionStorage.setItem('bingo_pending_version', data.version);
          } catch {}
        }
      }
    } catch {
      // Network errors or offline mode
    }
  }, [isSafeToUpdate, location.pathname, executeApplyUpdate]);

  // Periodic and lifecycle update checks with jitter to prevent server load spikes
  useEffect(() => {
    checkForUpdates();

    // Check every 60s (+/- 12s jitter) in lobby/home, throttled to 180s during gameplay
    const baseInterval = isPlayingOrInRoom ? 180000 : 60000;
    const jitter = Math.floor(Math.random() * 24000) - 12000;
    const interval = setInterval(checkForUpdates, baseInterval + jitter);

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
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [checkForUpdates, isPlayingOrInRoom]);

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
