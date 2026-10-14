// Anonymous Secret User ID, Device Analytics, and Offline Sync Service

const SECRET_ID_KEY = '_b_device_id';
const OFFLINE_QUEUE_KEY = '_b_offline_events';

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Generate or retrieve the anonymous secret ID assigned to this device/member
export function getOrCreateSecretUserId() {
  try {
    let id = localStorage.getItem(SECRET_ID_KEY);
    if (!id) {
      const arr = new Uint8Array(12);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(arr);
      } else {
        for (let i = 0; i < 12; i++) arr[i] = Math.floor(Math.random() * 256);
      }
      id = 'usr_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(SECRET_ID_KEY, id);
    }
    return id;
  } catch {
    return 'usr_anonymous';
  }
}

// Check if running in installed PWA standalone mode
export function isInstalledPwa() {
  try {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator.standalone === true;
    return Boolean(isStandalone || isIosStandalone);
  } catch {
    return false;
  }
}

// Send active heartbeat
export async function sendHeartbeat() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const userId = getOrCreateSecretUserId();
  const isPwa = isInstalledPwa();

  try {
    await fetch('/api/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPwa }),
      keepalive: true
    });
  } catch {}
}

// Track install event
export async function reportInstallEvent() {
  const userId = getOrCreateSecretUserId();
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event: 'installed' })
    });
  } catch {}
}

// Queue offline event locally
function queueOfflineEvent(event) {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(event);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
  } catch {}
}

// Flush and sync all offline queued events when connection is restored
export async function syncOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const events = JSON.parse(raw);
    if (!Array.isArray(events) || events.length === 0) return;

    const res = await fetch('/api/analytics/sync-offline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });

    if (res.ok) {
      // Successfully pushed: clear local memory queue
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log(`[Analytics] Successfully synced ${events.length} offline events.`);
    }
  } catch (err) {
    console.warn('[Analytics] Sync retry scheduled:', err);
  }
}

// Record Bot match completion (auto-queues locally if offline)
export async function trackBotGame({ difficulty, winner }) {
  const userId = getOrCreateSecretUserId();
  const payload = {
    type: 'bot_game',
    userId,
    difficulty,
    winner,
    timestamp: Date.now()
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOfflineEvent(payload);
    return;
  }

  try {
    const res = await fetch('/api/analytics/bot-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Bot game tracking failed');
  } catch {
    queueOfflineEvent(payload);
  }
}

// Check push capabilities and current permission status
export async function getPushSubscriptionState() {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return { supported: false, permission: 'unsupported' };
  }

  return {
    supported: true,
    permission: Notification.permission
  };
}

// Web Push Registration Helper
export async function registerPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { supported: false, error: 'Push notifications not supported on this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { supported: true, granted: false, error: 'Permission denied' };
    }

    const reg = await navigator.serviceWorker.ready;
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) throw new Error('Failed to retrieve VAPID public key');
    const { publicKey } = await keyRes.json();

    if (!publicKey) throw new Error('VAPID public key empty');

    const appServerKey = urlBase64ToUint8Array(publicKey);
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey
      });
    }

    const userId = getOrCreateSecretUserId();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: sub
      })
    });

    return { supported: true, granted: true, subscription: sub };
  } catch (err) {
    console.warn('[Push] Error subscribing to push:', err);
    return { supported: true, granted: false, error: err.message };
  }
}

// Initialize listeners
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  getOrCreateSecretUserId();
  sendHeartbeat();
  syncOfflineQueue();

  // Auto-sync push subscription if user already granted permission previously
  if ('Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      registerPushNotifications().catch(() => {});
    }, 2500);
  }

  // Periodic heartbeat every 3 minutes
  const interval = setInterval(() => {
    sendHeartbeat();
  }, 180000);

  // Sync when coming back online
  window.addEventListener('online', () => {
    sendHeartbeat();
    syncOfflineQueue();
  });

  // Track PWA install
  window.addEventListener('appinstalled', () => {
    reportInstallEvent();
  });

  return () => {
    clearInterval(interval);
  };
}
