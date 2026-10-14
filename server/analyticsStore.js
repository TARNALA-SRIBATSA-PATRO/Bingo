import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import webpush from 'web-push';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

// Default initial state
const defaultState = {
  users: {}, // { [userId]: { id, firstSeen, lastSeen, isPwa, installedAt, visits } }
  hourlyActivity: {}, // { 'YYYY-MM-DD': [0..23 counts] }
  dailyUniqueUsers: {}, // { 'YYYY-MM-DD': [userIds] }
  botStats: {
    totalMatches: 0,
    beginner: { total: 0, userWins: 0, botWins: 0 },
    intermediate: { total: 0, userWins: 0, botWins: 0 },
    pro: { total: 0, userWins: 0, botWins: 0 }
  },
  multiplayerStats: {
    roomsCreated: 0,
    matchesCompleted: 0
  },
  pushSubscriptions: {}, // { [endpoint]: { subscription, userId, createdAt } }
  notificationsHistory: [], // [ { id, title, message, url, sentAt, deliveredCount, failedCount } ]
  adminSecurity: {
    passwordHash: null,
    passwordSalt: null,
    vapidKeys: null
  }
};

let memoryStore = { ...defaultState };
let isDirty = false;
let flushTimer = null;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[AnalyticsStore] Failed to create data directory:', err);
  }
}

// Load persisted state from disk
function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      memoryStore = {
        ...defaultState,
        ...parsed,
        botStats: { ...defaultState.botStats, ...(parsed.botStats || {}) },
        multiplayerStats: { ...defaultState.multiplayerStats, ...(parsed.multiplayerStats || {}) },
        adminSecurity: { ...defaultState.adminSecurity, ...(parsed.adminSecurity || {}) }
      };
      console.log('[AnalyticsStore] State loaded from disk successfully.');
    } catch (e) {
      console.warn('[AnalyticsStore] Error loading analytics file, initializing fresh store:', e);
      memoryStore = { ...defaultState };
    }
  } else {
    memoryStore = { ...defaultState };
  }

  // Ensure VAPID keys exist
  if (!memoryStore.adminSecurity.vapidKeys) {
    const keys = webpush.generateVAPIDKeys();
    memoryStore.adminSecurity.vapidKeys = keys;
    isDirty = true;
    flushToDisk();
  }

  // Configure web-push
  if (memoryStore.adminSecurity.vapidKeys) {
    webpush.setVapidDetails(
      'mailto:admin@bingo-online.app',
      memoryStore.adminSecurity.vapidKeys.publicKey,
      memoryStore.adminSecurity.vapidKeys.privateKey
    );
  }

  // Ensure default admin password hash exists if not already set
  if (!memoryStore.adminSecurity.passwordHash) {
    setPassword(process.env.ADMIN_PASSWORD || 'BingoAdmin2026!');
  }
}

// Atomic save to disk
function flushToDisk() {
  try {
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(memoryStore, null, 2), 'utf8');
    fs.renameSync(tmpFile, DATA_FILE);
    isDirty = false;
  } catch (err) {
    console.error('[AnalyticsStore] Error flushing to disk:', err);
  }
}

// Debounced save
function scheduleFlush() {
  isDirty = true;
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushToDisk();
    }, 4000);
  }
}

// Password hashing with scrypt & salt
export function setPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  memoryStore.adminSecurity.passwordSalt = salt;
  memoryStore.adminSecurity.passwordHash = hash;
  scheduleFlush();
  return true;
}

export function verifyPassword(plainPassword) {
  const { passwordHash, passwordSalt } = memoryStore.adminSecurity;
  if (!passwordHash || !passwordSalt) return false;
  try {
    const testHash = crypto.scryptSync(plainPassword, passwordSalt, 64).toString('hex');
    const hashBuffer = Buffer.from(passwordHash, 'hex');
    const testBuffer = Buffer.from(testHash, 'hex');
    return crypto.timingSafeEqual(hashBuffer, testBuffer);
  } catch {
    return false;
  }
}

export function getVapidPublicKey() {
  return memoryStore.adminSecurity.vapidKeys?.publicKey || '';
}

// Get YYYY-MM-DD in UTC
function getTodayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Record User Heartbeat / Visit
export function recordHeartbeat({ userId, isPwa, userAgent }) {
  if (!userId) return;
  const now = Date.now();
  const todayKey = getTodayKey();
  const currentHour = new Date().getUTCHours();

  let user = memoryStore.users[userId];
  if (!user) {
    user = {
      id: userId,
      firstSeen: now,
      lastSeen: now,
      isPwa: Boolean(isPwa),
      installedAt: isPwa ? now : null,
      userAgent: userAgent ? userAgent.substring(0, 150) : '',
      visits: 1
    };
    memoryStore.users[userId] = user;
  } else {
    user.lastSeen = now;
    user.visits = (user.visits || 0) + 1;
    if (isPwa && !user.isPwa) {
      user.isPwa = true;
      if (!user.installedAt) user.installedAt = now;
    }
  }

  // Update hourly activity
  if (!memoryStore.hourlyActivity[todayKey]) {
    memoryStore.hourlyActivity[todayKey] = new Array(24).fill(0);
  }
  memoryStore.hourlyActivity[todayKey][currentHour] = (memoryStore.hourlyActivity[todayKey][currentHour] || 0) + 1;

  // Track daily unique users
  if (!memoryStore.dailyUniqueUsers[todayKey]) {
    memoryStore.dailyUniqueUsers[todayKey] = [];
  }
  if (!memoryStore.dailyUniqueUsers[todayKey].includes(userId)) {
    memoryStore.dailyUniqueUsers[todayKey].push(userId);
  }

  scheduleFlush();
}

// Record User Installed PWA
export function recordInstall({ userId }) {
  if (!userId) return;
  const now = Date.now();
  let user = memoryStore.users[userId];
  if (user) {
    user.isPwa = true;
    user.installedAt = now;
  } else {
    memoryStore.users[userId] = {
      id: userId,
      firstSeen: now,
      lastSeen: now,
      isPwa: true,
      installedAt: now,
      visits: 1
    };
  }
  scheduleFlush();
}

// Record Bot Match
export function recordBotGame({ userId, difficulty, winner }) {
  const diffKey = ['beginner', 'intermediate', 'pro'].includes(difficulty) ? difficulty : 'pro';
  memoryStore.botStats.totalMatches = (memoryStore.botStats.totalMatches || 0) + 1;

  const diffStats = memoryStore.botStats[diffKey] || { total: 0, userWins: 0, botWins: 0 };
  diffStats.total = (diffStats.total || 0) + 1;

  if (winner === 'user') {
    diffStats.userWins = (diffStats.userWins || 0) + 1;
  } else if (winner === 'bot') {
    diffStats.botWins = (diffStats.botWins || 0) + 1;
  }

  memoryStore.botStats[diffKey] = diffStats;

  if (userId && memoryStore.users[userId]) {
    memoryStore.users[userId].lastSeen = Date.now();
  }

  scheduleFlush();
}

// Batch Sync Offline Events
export function syncOfflineEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  let count = 0;
  for (const ev of events) {
    if (!ev || !ev.type) continue;
    if (ev.type === 'bot_game') {
      recordBotGame({
        userId: ev.userId,
        difficulty: ev.difficulty,
        winner: ev.winner
      });
      count++;
    } else if (ev.type === 'install') {
      recordInstall({ userId: ev.userId });
      count++;
    } else if (ev.type === 'heartbeat') {
      recordHeartbeat({ userId: ev.userId, isPwa: ev.isPwa, userAgent: ev.userAgent });
      count++;
    }
  }
  return count;
}

// Record Multiplayer Event
export function recordMultiplayerRoomCreated() {
  memoryStore.multiplayerStats.roomsCreated = (memoryStore.multiplayerStats.roomsCreated || 0) + 1;
  scheduleFlush();
}

export function recordMultiplayerGameCompleted() {
  memoryStore.multiplayerStats.matchesCompleted = (memoryStore.multiplayerStats.matchesCompleted || 0) + 1;
  scheduleFlush();
}

// Push Subscriptions
export function savePushSubscription({ userId, subscription }) {
  if (!subscription || !subscription.endpoint) return false;
  memoryStore.pushSubscriptions[subscription.endpoint] = {
    subscription,
    userId: userId || null,
    createdAt: Date.now()
  };
  scheduleFlush();
  return true;
}

export function removePushSubscription(endpoint) {
  if (endpoint && memoryStore.pushSubscriptions[endpoint]) {
    delete memoryStore.pushSubscriptions[endpoint];
    scheduleFlush();
  }
}

export function getPushSubscriptionsList() {
  return Object.values(memoryStore.pushSubscriptions || {});
}

// Record Sent Notification
export function recordSentNotification({ title, message, url, deliveredCount, failedCount }) {
  const record = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    message,
    url: url || '/',
    sentAt: Date.now(),
    deliveredCount: deliveredCount || 0,
    failedCount: failedCount || 0
  };
  memoryStore.notificationsHistory.unshift(record);
  if (memoryStore.notificationsHistory.length > 100) {
    memoryStore.notificationsHistory = memoryStore.notificationsHistory.slice(0, 100);
  }
  scheduleFlush();
  return record;
}

export function getNotificationsHistory() {
  return memoryStore.notificationsHistory || [];
}

// Compute Statistics for Admin Dashboard
export function getAdminDashboardStats({ startDate, endDate } = {}) {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const todayKey = getTodayKey();

  const allUsersList = Object.values(memoryStore.users);
  const totalUsers = allUsersList.length;

  // Active right now (heartbeat within 5 minutes)
  const currentlyActiveUsers = allUsersList.filter(u => u.lastSeen >= fiveMinutesAgo).length;

  // Installed PWA users vs Web browser users
  const pwaInstalledUsers = allUsersList.filter(u => u.isPwa).length;
  const webBrowserUsers = totalUsers - pwaInstalledUsers;

  // Today's active unique users
  const todayUniqueUsersList = memoryStore.dailyUniqueUsers[todayKey] || [];
  const todayActiveUsers = todayUniqueUsersList.length;

  // Peak activity of today (24-hour histogram)
  const todayHourly = memoryStore.hourlyActivity[todayKey] || new Array(24).fill(0);
  let peakHour = 0;
  let peakHourCount = 0;
  todayHourly.forEach((count, hour) => {
    if (count > peakHourCount) {
      peakHourCount = count;
      peakHour = hour;
    }
  });

  // Calculate Date-to-Date filtered range
  let filteredStartDate = startDate ? new Date(startDate) : new Date(now - 7 * 24 * 60 * 60 * 1000);
  let filteredEndDate = endDate ? new Date(endDate) : new Date(now);

  const startMs = filteredStartDate.getTime();
  const endMs = filteredEndDate.getTime() + 24 * 60 * 60 * 1000; // inclusive end of day

  // Users active in range
  const activeInRangeUsers = allUsersList.filter(u => u.lastSeen >= startMs && u.lastSeen <= endMs).length;

  // Previous comparison period of equal duration
  const periodDuration = endMs - startMs;
  const prevPeriodStart = startMs - periodDuration;
  const prevPeriodEnd = startMs;
  const activeInPrevRangeUsers = allUsersList.filter(u => u.lastSeen >= prevPeriodStart && u.lastSeen < prevPeriodEnd).length;

  let percentageChange = 0;
  if (activeInPrevRangeUsers > 0) {
    percentageChange = Math.round(((activeInRangeUsers - activeInPrevRangeUsers) / activeInPrevRangeUsers) * 1000) / 10;
  } else if (activeInRangeUsers > 0) {
    percentageChange = 100;
  }

  // Daily timeline for charts (last 14 days or selected range)
  const timelineDays = [];
  const timelineDates = Object.keys(memoryStore.dailyUniqueUsers).sort();
  const targetDays = timelineDates.slice(-14);
  for (const d of targetDays) {
    timelineDays.push({
      date: d,
      activeUsers: (memoryStore.dailyUniqueUsers[d] || []).length,
      pings: (memoryStore.hourlyActivity[d] || []).reduce((a, b) => a + b, 0)
    });
  }

  // Bot Statistics & Win Ratios
  const botStats = memoryStore.botStats;
  const calcWinRate = (userWins, total) => {
    if (!total || total === 0) return 0;
    return Math.round((userWins / total) * 1000) / 10;
  };

  const botOverview = {
    totalMatches: botStats.totalMatches || 0,
    beginner: {
      total: botStats.beginner?.total || 0,
      userWins: botStats.beginner?.userWins || 0,
      botWins: botStats.beginner?.botWins || 0,
      userWinRate: calcWinRate(botStats.beginner?.userWins, botStats.beginner?.total),
      botWinRate: calcWinRate(botStats.beginner?.botWins, botStats.beginner?.total)
    },
    intermediate: {
      total: botStats.intermediate?.total || 0,
      userWins: botStats.intermediate?.userWins || 0,
      botWins: botStats.intermediate?.botWins || 0,
      userWinRate: calcWinRate(botStats.intermediate?.userWins, botStats.intermediate?.total),
      botWinRate: calcWinRate(botStats.intermediate?.botWins, botStats.intermediate?.total)
    },
    pro: {
      total: botStats.pro?.total || 0,
      userWins: botStats.pro?.userWins || 0,
      botWins: botStats.pro?.botWins || 0,
      userWinRate: calcWinRate(botStats.pro?.userWins, botStats.pro?.total),
      botWinRate: calcWinRate(botStats.pro?.botWins, botStats.pro?.total)
    }
  };

  return {
    overview: {
      totalUsers,
      currentlyActiveUsers,
      todayActiveUsers,
      pwaInstalledUsers,
      webBrowserUsers,
      peakHour: `${String(peakHour).padStart(2, '0')}:00 - ${String((peakHour + 1) % 24).padStart(2, '0')}:00`,
      peakHourPings: peakHourCount,
      activeInRangeUsers,
      percentageChange,
      totalPushSubscribers: Object.keys(memoryStore.pushSubscriptions || {}).length,
      totalRoomsCreated: memoryStore.multiplayerStats?.roomsCreated || 0,
      totalMatchesCompleted: memoryStore.multiplayerStats?.matchesCompleted || 0
    },
    todayHourlyActivity: todayHourly,
    activityTimeline: timelineDays,
    botOverview,
    multiplayerStats: memoryStore.multiplayerStats
  };
}

// Broadcast Web Push to all subscribed users
export async function sendBroadcastPushNotification({ title, message, url }) {
  const subscriptions = getPushSubscriptionsList();
  if (subscriptions.length === 0) {
    return {
      success: true,
      deliveredCount: 0,
      failedCount: 0,
      message: 'No push subscribers registered yet.'
    };
  }

  const payload = JSON.stringify({
    title: title || 'Bingo Alert!',
    body: message || 'Check out what is new in Bingo!',
    icon: '/icons/icon-192.png',
    badge: '/favicon.svg',
    url: url || '/',
    timestamp: Date.now()
  });

  let deliveredCount = 0;
  let failedCount = 0;

  const pushPromises = subscriptions.map(async (item) => {
    try {
      await webpush.sendNotification(item.subscription, payload);
      deliveredCount++;
    } catch (err) {
      failedCount++;
      // If subscription expired or unsubscribed (404/410), prune from store
      if (err.statusCode === 404 || err.statusCode === 410) {
        removePushSubscription(item.subscription.endpoint);
      }
    }
  });

  await Promise.allSettled(pushPromises);

  const historyRecord = recordSentNotification({
    title,
    message,
    url,
    deliveredCount,
    failedCount
  });

  return {
    success: true,
    deliveredCount,
    failedCount,
    totalSubscribers: subscriptions.length,
    historyRecord
  };
}

// Initialize on module import
loadStore();
