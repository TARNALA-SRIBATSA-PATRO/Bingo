// Anonymous Secret User ID, Device Analytics, and Offline Sync Service

const SECRET_ID_KEY = '_b_device_id';
const OFFLINE_QUEUE_KEY = '_b_offline_events';
const LIFETIME_STATS_KEY = '_b_lifetime_bot_stats';

// Retrieve or initialize the device's persistent lifetime bot statistics
export function getLifetimeBotStats() {
  let stats = null;
  try {
    const raw = localStorage.getItem(LIFETIME_STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') stats = parsed;
    }
  } catch {}

  if (!stats) {
    stats = {
      totalMatches: 0,
      beginner: { total: 0, userWins: 0, botWins: 0, draws: 0 },
      intermediate: { total: 0, userWins: 0, botWins: 0, draws: 0 },
      pro: { total: 0, userWins: 0, botWins: 0, draws: 0 }
    };
  }

  // Ensure all difficulties have draws populated even from older app versions
  for (const diff of ['beginner', 'intermediate', 'pro']) {
    if (!stats[diff]) {
      stats[diff] = { total: 0, userWins: 0, botWins: 0, draws: 0 };
    } else {
      const curTot = stats[diff].total || 0;
      const curU = stats[diff].userWins || 0;
      const curB = stats[diff].botWins || 0;
      stats[diff].draws = stats[diff].draws !== undefined
        ? Math.max(stats[diff].draws, Math.max(0, curTot - curU - curB))
        : Math.max(0, curTot - curU - curB);
    }
  }

  return stats;
}

// Record bot match in the client's permanent localStorage vault
export function recordLocalBotMatch(difficulty, winner) {
  const stats = getLifetimeBotStats();
  const diffKey = ['beginner', 'intermediate', 'pro'].includes(difficulty) ? difficulty : 'pro';

  if (!stats[diffKey]) {
    stats[diffKey] = { total: 0, userWins: 0, botWins: 0, draws: 0 };
  }

  stats.totalMatches = (stats.totalMatches || 0) + 1;
  stats[diffKey].total = (stats[diffKey].total || 0) + 1;

  if (winner === 'user') {
    stats[diffKey].userWins = (stats[diffKey].userWins || 0) + 1;
  } else if (winner === 'bot') {
    stats[diffKey].botWins = (stats[diffKey].botWins || 0) + 1;
  } else if (winner === 'tie' || winner === 'draw') {
    stats[diffKey].draws = (stats[diffKey].draws || 0) + 1;
  }

  // Ensure draws is synchronized with total - wins
  const curTot = stats[diffKey].total || 0;
  const curU = stats[diffKey].userWins || 0;
  const curB = stats[diffKey].botWins || 0;
  stats[diffKey].draws = stats[diffKey].draws !== undefined
    ? Math.max(stats[diffKey].draws, Math.max(0, curTot - curU - curB))
    : Math.max(0, curTot - curU - curB);

  try {
    localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(stats));
  } catch {}

  return stats;
}

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

// Check if currently on the admin portal or logged in as admin (never count admin as player)
export function isCurrentSessionAdmin() {
  if (typeof window === 'undefined') return false;
  try {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin') || path.includes('sys-admin-panel')) return true;
    if (sessionStorage.getItem('bingo_admin_token') || sessionStorage.getItem('bingo_is_admin')) return true;
  } catch {}
  return false;
}

// Send active heartbeat (carries persistent lifetime bot stats so server is auto-healed on redeploy)
export async function sendHeartbeat() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (isCurrentSessionAdmin()) return;
  const userId = getOrCreateSecretUserId();
  const isPwa = isInstalledPwa();
  const lifetimeBotStats = getLifetimeBotStats();

  try {
    await fetch('/api/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPwa, lifetimeBotStats }),
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

// Record Bot match completion (persists in permanent localStorage vault and syncs to server)
export async function trackBotGame({ difficulty, winner }) {
  const userId = getOrCreateSecretUserId();
  const lifetimeStats = recordLocalBotMatch(difficulty, winner);

  const payload = {
    type: 'bot_game',
    userId,
    difficulty,
    winner,
    lifetimeStats,
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
  if (typeof window === 'undefined') return () => {};
  if (isCurrentSessionAdmin()) return () => {};

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
