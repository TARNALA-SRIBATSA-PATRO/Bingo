import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import webpush from 'web-push';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  isDbConnected,
  getDbError,
  loadAllFromDatabase,
  saveKeyToDatabase,
  saveMultipleKeysToDatabase
} from './db.js';
import {
  generateSmartNotificationCampaign,
  getContextualMatrix,
  formatTimeIST,
  formatDateIST
} from './aiNotificationEngine.js';
export { generateSmartNotificationCampaign, getContextualMatrix, formatTimeIST, formatDateIST };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

// Permanent stable VAPID keys (can be overridden via environment variables)
const DEFAULT_VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BFj-guGTD6_nMN0vKXE-AA0-AAJjqmbfGR-URs6sX_oH1E_kaj9fEuTe59JgKVi6xmLdpG3UztFrlU3BlHluPyE',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'r-YnmWDQor4RUJQ-U4KQNsjV5ESQvYS67ZD_zPMrRpM'
};

// Default initial state
const defaultState = {
  users: {}, // { [userId]: { id, firstSeen, lastSeen, isPwa, installedAt, visits } }
  hourlyActivity: {}, // { 'YYYY-MM-DD': [0..23 counts] }
  dailyUniqueUsers: {}, // { 'YYYY-MM-DD': [userIds] }
  botStats: {
    totalMatches: 0,
    totalDurationMs: 0,
    matchesWithDuration: 0,
    beginner: { total: 0, userWins: 0, botWins: 0, draws: 0 },
    intermediate: { total: 0, userWins: 0, botWins: 0, draws: 0 },
    pro: { total: 0, userWins: 0, botWins: 0, draws: 0 }
  },
  multiplayerStats: {
    roomsCreated: 0,
    matchesCompleted: 0,
    totalDurationMs: 0,
    matchesWithDuration: 0,
    totalPlayerSlots: 0,
    roomsSampledForSize: 0
  },
  pushSubscriptions: {}, // { [endpoint]: { subscription, userId, createdAt } }
  notificationsHistory: [], // [ { id, title, message, url, sentAt, deliveredCount, failedCount, clicksCount, conversionsCount } ]
  scheduledNotifications: [], // [ { id, title, message, url, scheduledAt, createdAt, status } ]
  aiAutoPilot: {
    enabled: false,
    lastScheduledDate: null,
    lastRunAt: null,
    geminiApiKey: null
  },
  schedulingNotices: [], // [ { id, campaignId, title, scheduledAt, scheduledAtDesc, message, advanceNoticeSent, createdAt } ]
  pushFunnel: {
    promptsShown: 0,
    promptsGranted: 0,
    promptsDenied: 0,
    totalClicks: 0,
    totalConversions: 0
  },
  adminSecurity: {
    passwordHash: null,
    passwordSalt: null,
    vapidKeys: DEFAULT_VAPID_KEYS
  }
};

let memoryStore = { ...defaultState };
let isDirty = false;
let flushTimer = null;
const dirtyDbKeys = new Set();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[AnalyticsStore] Failed to create data directory:', err);
  }
}

// Load persisted state from disk and sync with PostgreSQL if available
async function loadStore() {
  // 1. Synchronously load local disk cache if available
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      memoryStore = {
        ...defaultState,
        ...parsed,
        botStats: { ...defaultState.botStats, ...(parsed.botStats || {}) },
        multiplayerStats: { ...defaultState.multiplayerStats, ...(parsed.multiplayerStats || {}) },
        pushFunnel: { ...defaultState.pushFunnel, ...(parsed.pushFunnel || {}) },
        scheduledNotifications: Array.isArray(parsed.scheduledNotifications) ? parsed.scheduledNotifications : [],
        aiAutoPilot: { ...defaultState.aiAutoPilot, ...(parsed.aiAutoPilot || {}) },
        schedulingNotices: Array.isArray(parsed.schedulingNotices) ? parsed.schedulingNotices : [],
        adminSecurity: { ...defaultState.adminSecurity, ...(parsed.adminSecurity || {}) }
      };
      recomputeAggregatedBotStats();
      console.log('[AnalyticsStore] Local cache loaded from disk.');
    } catch (e) {
      console.warn('[AnalyticsStore] Error reading local analytics cache:', e);
      memoryStore = { ...defaultState };
    }
  } else {
    memoryStore = { ...defaultState };
  }

  // 2. Ensure stable VAPID keys exist
  if (!memoryStore.adminSecurity.vapidKeys) {
    memoryStore.adminSecurity.vapidKeys = DEFAULT_VAPID_KEYS;
    flushToDisk();
  }

  // 3. Configure web-push
  if (memoryStore.adminSecurity.vapidKeys) {
    try {
      webpush.setVapidDetails(
        'mailto:admin@bingo-online.app',
        memoryStore.adminSecurity.vapidKeys.publicKey,
        memoryStore.adminSecurity.vapidKeys.privateKey
      );
    } catch (err) {
      console.warn('[AnalyticsStore] Web push setup warning:', err.message);
    }
  }

  // 4. Ensure default admin password hash exists initially if absent
  if (!memoryStore.adminSecurity.passwordHash) {
    setPassword(process.env.ADMIN_PASSWORD || 'BingoAdmin2026!');
  }

  // 5. Connect and synchronize with PostgreSQL Cloud Database if DATABASE_URL is set
  try {
    const dbInit = await initDatabase();
    if (dbInit.connected) {
      const dbRows = await loadAllFromDatabase();
      if (dbRows && Object.keys(dbRows).length > 0) {
        if (dbRows.users) memoryStore.users = { ...memoryStore.users, ...dbRows.users };
        if (dbRows.hourly_activity) memoryStore.hourlyActivity = { ...memoryStore.hourlyActivity, ...dbRows.hourly_activity };
        if (dbRows.daily_unique_users) memoryStore.dailyUniqueUsers = { ...memoryStore.dailyUniqueUsers, ...dbRows.daily_unique_users };
        if (dbRows.bot_stats) memoryStore.botStats = { ...defaultState.botStats, ...dbRows.bot_stats };
        if (dbRows.multiplayer_stats) memoryStore.multiplayerStats = { ...defaultState.multiplayerStats, ...dbRows.multiplayer_stats };
        if (dbRows.push_subscriptions) memoryStore.pushSubscriptions = { ...memoryStore.pushSubscriptions, ...dbRows.push_subscriptions };
        if (dbRows.notifications_history) memoryStore.notificationsHistory = Array.isArray(dbRows.notifications_history) ? dbRows.notifications_history : [];
        if (dbRows.scheduled_notifications) memoryStore.scheduledNotifications = Array.isArray(dbRows.scheduled_notifications) ? dbRows.scheduled_notifications : [];
        if (dbRows.push_funnel) memoryStore.pushFunnel = { ...defaultState.pushFunnel, ...dbRows.push_funnel };
        if (dbRows.ai_auto_pilot) memoryStore.aiAutoPilot = { ...defaultState.aiAutoPilot, ...dbRows.ai_auto_pilot };
        if (dbRows.scheduling_notices) memoryStore.schedulingNotices = Array.isArray(dbRows.scheduling_notices) ? dbRows.scheduling_notices : [];
        if (dbRows.admin_security && dbRows.admin_security.passwordHash) {
          memoryStore.adminSecurity = { ...defaultState.adminSecurity, ...dbRows.admin_security };
        }

        recomputeAggregatedBotStats();
        flushToDisk();
        console.log('[AnalyticsStore] State successfully loaded and synced from PostgreSQL cloud database!');
      } else {
        console.log('[AnalyticsStore] Initializing fresh PostgreSQL store with current data...');
        await saveMultipleKeysToDatabase({
          users: memoryStore.users,
          hourly_activity: memoryStore.hourlyActivity,
          daily_unique_users: memoryStore.dailyUniqueUsers,
          bot_stats: memoryStore.botStats,
          multiplayer_stats: memoryStore.multiplayerStats,
          push_subscriptions: memoryStore.pushSubscriptions,
          notifications_history: memoryStore.notificationsHistory,
          scheduled_notifications: memoryStore.scheduledNotifications,
          push_funnel: memoryStore.pushFunnel,
          ai_auto_pilot: memoryStore.aiAutoPilot,
          scheduling_notices: memoryStore.schedulingNotices,
          admin_security: memoryStore.adminSecurity
        });
      }
    }
  } catch (err) {
    console.error('[AnalyticsStore] Error during PostgreSQL cloud sync:', err.message);
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

// Save dirty keys to PostgreSQL cloud database
async function flushStore() {
  flushToDisk();
  if (isDbConnected()) {
    try {
      const keys = dirtyDbKeys.size > 0
        ? Array.from(dirtyDbKeys)
        : ['users', 'hourly_activity', 'daily_unique_users', 'bot_stats', 'multiplayer_stats', 'push_subscriptions', 'notifications_history', 'scheduled_notifications', 'push_funnel', 'ai_auto_pilot', 'scheduling_notices', 'admin_security'];
      dirtyDbKeys.clear();

      for (const k of keys) {
        if (k === 'users') await saveKeyToDatabase('users', memoryStore.users);
        else if (k === 'hourly_activity') await saveKeyToDatabase('hourly_activity', memoryStore.hourlyActivity);
        else if (k === 'daily_unique_users') await saveKeyToDatabase('daily_unique_users', memoryStore.dailyUniqueUsers);
        else if (k === 'bot_stats') await saveKeyToDatabase('bot_stats', memoryStore.botStats);
        else if (k === 'multiplayer_stats') await saveKeyToDatabase('multiplayer_stats', memoryStore.multiplayerStats);
        else if (k === 'push_subscriptions') await saveKeyToDatabase('push_subscriptions', memoryStore.pushSubscriptions);
        else if (k === 'notifications_history') await saveKeyToDatabase('notifications_history', memoryStore.notificationsHistory);
        else if (k === 'scheduled_notifications') await saveKeyToDatabase('scheduled_notifications', memoryStore.scheduledNotifications);
        else if (k === 'push_funnel') await saveKeyToDatabase('push_funnel', memoryStore.pushFunnel);
        else if (k === 'ai_auto_pilot') await saveKeyToDatabase('ai_auto_pilot', memoryStore.aiAutoPilot);
        else if (k === 'scheduling_notices') await saveKeyToDatabase('scheduling_notices', memoryStore.schedulingNotices);
        else if (k === 'admin_security') await saveKeyToDatabase('admin_security', memoryStore.adminSecurity);
      }
    } catch (err) {
      console.error('[AnalyticsStore] Error saving dirty keys to PostgreSQL:', err.message);
    }
  }
}

// Debounced save
function scheduleFlush(dbKey) {
  isDirty = true;
  if (dbKey) {
    dirtyDbKeys.add(dbKey);
  }
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushStore();
    }, 3000);
  }
}

// Password hashing with scrypt & salt
export function setPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  memoryStore.adminSecurity.passwordSalt = salt;
  memoryStore.adminSecurity.passwordHash = hash;
  flushToDisk();
  if (isDbConnected()) {
    saveKeyToDatabase('admin_security', memoryStore.adminSecurity).catch(err => {
      console.error('[AnalyticsStore] Error saving new password to database:', err);
    });
  } else {
    scheduleFlush('admin_security');
  }
  return true;
}


export function verifyPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') return false;

  // 1. If ADMIN_PASSWORD is set in Render environment, it has highest authority and survives all rebuilds
  if (process.env.ADMIN_PASSWORD && plainPassword === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // 2. Otherwise verify using salted scrypt hash
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

// Re-aggregate global bot stats from all users' persistent lifetime profiles
export function recomputeAggregatedBotStats() {
  const aggregated = {
    beginner: { total: 0, userWins: 0, botWins: 0, draws: 0 },
    intermediate: { total: 0, userWins: 0, botWins: 0, draws: 0 },
    pro: { total: 0, userWins: 0, botWins: 0, draws: 0 }
  };

  for (const user of Object.values(memoryStore.users || {})) {
    if (user && user.botStats) {
      for (const diff of ['beginner', 'intermediate', 'pro']) {
        const d = user.botStats[diff];
        if (d) {
          const tot = d.total || 0;
          const uW = d.userWins || 0;
          const bW = d.botWins || 0;
          const drw = d.draws !== undefined ? d.draws : Math.max(0, tot - uW - bW);

          aggregated[diff].total += tot;
          aggregated[diff].userWins += uW;
          aggregated[diff].botWins += bW;
          aggregated[diff].draws += drw;
        }
      }
    }
  }

  for (const diff of ['beginner', 'intermediate', 'pro']) {
    if (!memoryStore.botStats[diff]) {
      memoryStore.botStats[diff] = { total: 0, userWins: 0, botWins: 0, draws: 0 };
    }
    const curTot = Math.max(memoryStore.botStats[diff].total || 0, aggregated[diff].total);
    const curU = Math.max(memoryStore.botStats[diff].userWins || 0, aggregated[diff].userWins);
    const curB = Math.max(memoryStore.botStats[diff].botWins || 0, aggregated[diff].botWins);
    const rawDraws = Math.max(memoryStore.botStats[diff].draws || 0, aggregated[diff].draws);
    const curDraws = Math.max(rawDraws, Math.max(0, curTot - curU - curB));

    memoryStore.botStats[diff].total = curTot;
    memoryStore.botStats[diff].userWins = curU;
    memoryStore.botStats[diff].botWins = curB;
    memoryStore.botStats[diff].draws = curDraws;
  }

  const computedTotal = (memoryStore.botStats.beginner?.total || 0) + (memoryStore.botStats.intermediate?.total || 0) + (memoryStore.botStats.pro?.total || 0);
  memoryStore.botStats.totalMatches = Math.max(memoryStore.botStats.totalMatches || 0, computedTotal);
}

// Exclude admin user device from player counts and statistics
export function excludeAdminUser(userId) {
  if (!userId) return;
  let changed = false;
  if (memoryStore.users[userId]) {
    delete memoryStore.users[userId];
    changed = true;
  }
  const todayKey = getTodayKey();
  if (memoryStore.dailyUniqueUsers[todayKey]) {
    const initLen = memoryStore.dailyUniqueUsers[todayKey].length;
    memoryStore.dailyUniqueUsers[todayKey] = memoryStore.dailyUniqueUsers[todayKey].filter(id => id !== userId);
    if (memoryStore.dailyUniqueUsers[todayKey].length !== initLen) {
      changed = true;
    }
  }
  if (changed) {
    flushToDisk();
    if (isDbConnected()) {
      saveKeyToDatabase('users', memoryStore.users);
      saveKeyToDatabase('daily_unique_users', memoryStore.dailyUniqueUsers);
    }
    console.log(`[AnalyticsStore] Successfully purged admin device ${userId} from player metrics.`);
  }
}

// Record User Heartbeat / Visit
export function recordHeartbeat({ userId, isPwa, userAgent, lifetimeBotStats }) {
  if (!userId) return;
  if (memoryStore.users[userId]?.isAdmin) return;
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
      visits: 1,
      botStats: lifetimeBotStats || null
    };
    memoryStore.users[userId] = user;
  } else {
    user.lastSeen = now;
    user.visits = (user.visits || 0) + 1;
    if (isPwa && !user.isPwa) {
      user.isPwa = true;
      if (!user.installedAt) user.installedAt = now;
    }
    if (lifetimeBotStats) {
      user.botStats = lifetimeBotStats;
    }
  }

  if (lifetimeBotStats) {
    recomputeAggregatedBotStats();
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
export function recordBotGame({ userId, difficulty, winner, lifetimeStats, durationMs }) {
  const diffKey = ['beginner', 'intermediate', 'pro'].includes(difficulty) ? difficulty : 'pro';

  if (typeof durationMs === 'number' && durationMs > 1000 && durationMs < 3600000) {
    memoryStore.botStats.totalDurationMs = (memoryStore.botStats.totalDurationMs || 0) + durationMs;
    memoryStore.botStats.matchesWithDuration = (memoryStore.botStats.matchesWithDuration || 0) + 1;
  }

  if (lifetimeStats && userId) {
    if (!memoryStore.users[userId]) {
      memoryStore.users[userId] = {
        id: userId,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        isPwa: false,
        visits: 1,
        botStats: lifetimeStats
      };
    } else {
      memoryStore.users[userId].botStats = lifetimeStats;
      memoryStore.users[userId].lastSeen = Date.now();
    }
    recomputeAggregatedBotStats();
  } else {
    memoryStore.botStats.totalMatches = (memoryStore.botStats.totalMatches || 0) + 1;
    const diffStats = memoryStore.botStats[diffKey] || { total: 0, userWins: 0, botWins: 0, draws: 0 };
    diffStats.total = (diffStats.total || 0) + 1;

    if (winner === 'user') {
      diffStats.userWins = (diffStats.userWins || 0) + 1;
    } else if (winner === 'bot') {
      diffStats.botWins = (diffStats.botWins || 0) + 1;
    } else if (winner === 'tie' || winner === 'draw') {
      diffStats.draws = (diffStats.draws || 0) + 1;
    }

    const dTot = diffStats.total || 0;
    const dU = diffStats.userWins || 0;
    const dB = diffStats.botWins || 0;
    diffStats.draws = diffStats.draws !== undefined
      ? Math.max(diffStats.draws, Math.max(0, dTot - dU - dB))
      : Math.max(0, dTot - dU - dB);

    memoryStore.botStats[diffKey] = diffStats;

    if (userId && memoryStore.users[userId]) {
      memoryStore.users[userId].lastSeen = Date.now();
    }
  }

  scheduleFlush('bot_stats');
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
        winner: ev.winner,
        durationMs: ev.durationMs
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
  scheduleFlush('multiplayer_stats');
}

export function recordMultiplayerGameCompleted({ durationMs, playerCount } = {}) {
  memoryStore.multiplayerStats.matchesCompleted = (memoryStore.multiplayerStats.matchesCompleted || 0) + 1;
  if (typeof durationMs === 'number' && durationMs > 1000 && durationMs < 3600000) {
    memoryStore.multiplayerStats.totalDurationMs = (memoryStore.multiplayerStats.totalDurationMs || 0) + durationMs;
    memoryStore.multiplayerStats.matchesWithDuration = (memoryStore.multiplayerStats.matchesWithDuration || 0) + 1;
  }
  if (typeof playerCount === 'number' && playerCount >= 2 && playerCount <= 4) {
    memoryStore.multiplayerStats.totalPlayerSlots = (memoryStore.multiplayerStats.totalPlayerSlots || 0) + playerCount;
    memoryStore.multiplayerStats.roomsSampledForSize = (memoryStore.multiplayerStats.roomsSampledForSize || 0) + 1;
  }
  scheduleFlush('multiplayer_stats');
}

// Push Subscriptions
export function savePushSubscription({ userId, subscription }) {
  if (!subscription || !subscription.endpoint) return false;
  memoryStore.pushSubscriptions[subscription.endpoint] = {
    subscription,
    userId: userId || null,
    createdAt: Date.now()
  };
  scheduleFlush('push_subscriptions');
  return true;
}

export function removePushSubscription(endpoint) {
  if (endpoint && memoryStore.pushSubscriptions[endpoint]) {
    delete memoryStore.pushSubscriptions[endpoint];
    scheduleFlush('push_subscriptions');
  }
}

export function getPushSubscriptionsList() {
  return Object.values(memoryStore.pushSubscriptions || {});
}

// Push Prompt Funnel Tracker (shown / granted / denied)
export function recordPushPrompt({ status }) {
  if (!memoryStore.pushFunnel) {
    memoryStore.pushFunnel = { ...defaultState.pushFunnel };
  }
  if (status === 'shown') {
    memoryStore.pushFunnel.promptsShown = (memoryStore.pushFunnel.promptsShown || 0) + 1;
  } else if (status === 'granted') {
    memoryStore.pushFunnel.promptsGranted = (memoryStore.pushFunnel.promptsGranted || 0) + 1;
  } else if (status === 'denied') {
    memoryStore.pushFunnel.promptsDenied = (memoryStore.pushFunnel.promptsDenied || 0) + 1;
  }
  scheduleFlush('push_funnel');
}

// Push Click Tracker (tracks when recipient clicks notification)
export function recordPushClick({ pushId, userId }) {
  if (!memoryStore.pushFunnel) {
    memoryStore.pushFunnel = { ...defaultState.pushFunnel };
  }
  memoryStore.pushFunnel.totalClicks = (memoryStore.pushFunnel.totalClicks || 0) + 1;
  if (pushId && Array.isArray(memoryStore.notificationsHistory)) {
    const item = memoryStore.notificationsHistory.find(n => n.id === pushId);
    if (item) {
      item.clicksCount = (item.clicksCount || 0) + 1;
    }
  }
  scheduleFlush('push_funnel');
  scheduleFlush('notifications_history');
}

// Push Conversion Tracker (tracks when push clicker actually plays a game)
export function recordPushConvert({ pushId, userId }) {
  if (!memoryStore.pushFunnel) {
    memoryStore.pushFunnel = { ...defaultState.pushFunnel };
  }
  memoryStore.pushFunnel.totalConversions = (memoryStore.pushFunnel.totalConversions || 0) + 1;
  if (pushId && Array.isArray(memoryStore.notificationsHistory)) {
    const item = memoryStore.notificationsHistory.find(n => n.id === pushId);
    if (item) {
      item.conversionsCount = (item.conversionsCount || 0) + 1;
    }
  }
  scheduleFlush('push_funnel');
  scheduleFlush('notifications_history');
}

// Record Sent Notification
export function recordSentNotification({ id, title, message, url, deliveredCount, failedCount }) {
  const record = {
    id: id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    message,
    url: url || '/',
    sentAt: Date.now(),
    deliveredCount: deliveredCount || 0,
    failedCount: failedCount || 0,
    clicksCount: 0,
    conversionsCount: 0
  };
  memoryStore.notificationsHistory.unshift(record);
  if (memoryStore.notificationsHistory.length > 100) {
    memoryStore.notificationsHistory = memoryStore.notificationsHistory.slice(0, 100);
  }
  scheduleFlush('notifications_history');
  return record;
}

export function getNotificationsHistory() {
  const history = memoryStore.notificationsHistory || [];
  // Exclude legacy reminder notices so the table strictly displays real delivered messages
  const clean = history.filter(item => {
    if (!item || !item.title) return false;
    if (item.title.startsWith('📅 Scheduled:')) return false;
    return true;
  });
  // Strictly sort descending by sentAt so the latest is always on top (upper)
  return clean.sort((a, b) => {
    const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return timeB - timeA;
  });
}

// Get YYYY-MM-DD in Indian Standard Time (IST)
export function getTodayKeyIST(date = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Retrieve notifications sent today + recent history for AI anti-repetition memory
export function getSentTodayAndRecent() {
  const todayKeyIST = getTodayKeyIST();
  const rawHistory = memoryStore.notificationsHistory || [];
  const history = rawHistory.filter(item => {
    if (!item || !item.title) return false;
    if (item.title.startsWith('📅 Scheduled:')) return false;
    return true;
  });
  const scheduled = memoryStore.scheduledNotifications || [];

  const sentTodayList = history.filter(item => {
    if (!item.sentAt) return false;
    return getTodayKeyIST(new Date(item.sentAt)) === todayKeyIST;
  });

  const pendingScheduledList = scheduled.filter(item => {
    return item.status === 'pending' && item.scheduledAt > Date.now();
  });

  return {
    sentTodayCount: sentTodayList.length,
    sentTodayList: sentTodayList.map(h => ({
      id: h.id,
      title: h.title,
      message: h.message,
      sentAt: h.sentAt,
      clicksCount: h.clicksCount || 0,
      conversionsCount: h.conversionsCount || 0
    })),
    recentList: history.slice(0, 5).map(h => ({
      id: h.id,
      title: h.title,
      message: h.message,
      sentAt: h.sentAt
    })),
    pendingScheduledCount: pendingScheduledList.length,
    pendingScheduledList: pendingScheduledList.map(s => ({
      id: s.id,
      title: s.title,
      scheduledAt: s.scheduledAt
    }))
  };
}

// -------------------------------------------------------------
// SCHEDULED PUSH NOTIFICATIONS (DIRECT DISPATCH)
// -------------------------------------------------------------
export async function schedulePushNotification({
  title,
  message,
  url,
  scheduledAt,
  source = 'manual'
}) {
  if (!title || !message) {
    throw new Error('Title and message are required.');
  }

  let time = typeof scheduledAt === 'number' ? scheduledAt : new Date(scheduledAt).getTime();
  if (isNaN(time) || time <= Date.now()) {
    throw new Error('Scheduled date and time must be set in the future.');
  }

  // If scheduled automatically via AI Auto-Pilot, strictly enforce minimum 2 hours review buffer
  if (source === 'ai_autopilot') {
    const minBuffer = Date.now() + 2 * 60 * 60 * 1000;
    if (time < minBuffer) {
      time = minBuffer + 15 * 60 * 1000;
    }
  }

  const schedId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item = {
    id: schedId,
    title: title.trim(),
    message: message.trim(),
    url: (url && url.trim()) || '/lobby',
    scheduledAt: time,
    createdAt: Date.now(),
    source, // 'manual' | 'ai_studio' | 'ai_autopilot'
    status: 'pending' // 'pending' | 'sent' | 'cancelled'
  };

  if (!memoryStore.scheduledNotifications) {
    memoryStore.scheduledNotifications = [];
  }

  memoryStore.scheduledNotifications.push(item);
  memoryStore.scheduledNotifications.sort((a, b) => a.scheduledAt - b.scheduledAt);

  scheduleFlush('scheduled_notifications');
  return { scheduledItem: item };
}

export function getSchedulingNotices() {
  return [];
}

export function getAiAutoPilotConfig() {
  const cfg = memoryStore.aiAutoPilot || defaultState.aiAutoPilot;
  return {
    ...cfg,
    hasEnvKey: Boolean(process.env.GEMINI_API_KEY)
  };
}

export function updateAiAutoPilotConfig({ enabled, geminiApiKey }) {
  if (!memoryStore.aiAutoPilot) {
    memoryStore.aiAutoPilot = { ...defaultState.aiAutoPilot };
  }
  if (enabled !== undefined) {
    memoryStore.aiAutoPilot.enabled = Boolean(enabled);
  }
  if (geminiApiKey !== undefined) {
    memoryStore.aiAutoPilot.geminiApiKey = (typeof geminiApiKey === 'string' && geminiApiKey.trim())
      ? geminiApiKey.trim()
      : null;
  }
  scheduleFlush('ai_auto_pilot');
  return memoryStore.aiAutoPilot;
}

export async function processAiAutoPilotTick() {
  if (!memoryStore.aiAutoPilot || !memoryStore.aiAutoPilot.enabled) return;

  const todayKey = getTodayKey();
  if (memoryStore.aiAutoPilot.lastScheduledDate === todayKey) return;

  const now = Date.now();
  const hasPending = (memoryStore.scheduledNotifications || []).some(
    n => n.status === 'pending' && n.scheduledAt > now
  );
  if (hasPending) {
    return;
  }

  try {
    const stats = getAdminDashboardStats();
    const historyData = getSentTodayAndRecent();
    const effectiveKey = memoryStore.aiAutoPilot.geminiApiKey || process.env.GEMINI_API_KEY;
    const campaign = await generateSmartNotificationCampaign({
      stats,
      historyData,
      apiKey: effectiveKey
    });

    if (campaign && campaign.suggestions && campaign.suggestions.length > 0) {
      const topPick = campaign.suggestions[0];
      let triggerTime = topPick.scheduledAt;
      // Strictly enforce minimum 2 hours advance buffer
      if (!triggerTime || triggerTime < now + 2 * 60 * 60 * 1000) {
        triggerTime = now + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
      }

      await schedulePushNotification({
        title: topPick.title,
        message: topPick.message,
        url: topPick.url || '/lobby',
        scheduledAt: triggerTime,
        source: 'ai_autopilot'
      });

      memoryStore.aiAutoPilot.lastScheduledDate = todayKey;
      memoryStore.aiAutoPilot.lastRunAt = Date.now();
      scheduleFlush('ai_auto_pilot');
      console.log(`[AI Auto-Pilot] Auto-scheduled daily campaign (2hr+ buffer): "${topPick.title}" for ${formatTimeIST(triggerTime, true)}`);
    }
  } catch (err) {
    console.error('[AI Auto-Pilot] Error in auto-pilot tick:', err);
  }
}

export function getScheduledNotifications() {
  if (!memoryStore.scheduledNotifications) {
    memoryStore.scheduledNotifications = [];
  }
  return memoryStore.scheduledNotifications.filter(item => item.status === 'pending');
}

export function cancelScheduledNotification(id) {
  if (!id || !memoryStore.scheduledNotifications) return false;
  const item = memoryStore.scheduledNotifications.find(n => n.id === id);
  if (item && item.status === 'pending') {
    item.status = 'cancelled';
    scheduleFlush();
    return true;
  }
  return false;
}

export function updateScheduledNotification(id, { title, message, url, scheduledAt }) {
  if (!id || !memoryStore.scheduledNotifications) return null;
  const item = memoryStore.scheduledNotifications.find(n => n.id === id);
  if (!item || item.status !== 'pending') return null;

  if (title !== undefined && typeof title === 'string' && title.trim()) {
    item.title = title.trim();
  }
  if (message !== undefined && typeof message === 'string' && message.trim()) {
    item.message = message.trim();
  }
  if (url !== undefined && typeof url === 'string') {
    item.url = url.trim() || '/lobby';
  }
  if (scheduledAt !== undefined) {
    const timeMs = new Date(scheduledAt).getTime();
    if (!isNaN(timeMs) && timeMs > Date.now()) {
      item.scheduledAt = timeMs;
    }
  }

  item.updatedAt = Date.now();
  memoryStore.scheduledNotifications.sort((a, b) => a.scheduledAt - b.scheduledAt);
  scheduleFlush();
  return item;
}

// Process any pending scheduled push notifications that have become due
export async function processDueScheduledNotifications() {
  if (!memoryStore.scheduledNotifications || memoryStore.scheduledNotifications.length === 0) return;
  const now = Date.now();
  const due = memoryStore.scheduledNotifications.filter(
    n => n.status === 'pending' && n.scheduledAt <= now
  );

  for (const item of due) {
    item.status = 'processing';
    try {
      const result = await sendBroadcastPushNotification({
        title: item.title,
        message: item.message,
        url: item.url
      });
      item.status = 'sent';
      item.sentAt = Date.now();
      item.deliveredCount = result.deliveredCount || 0;
      item.failedCount = result.failedCount || 0;
      console.log(`[PushScheduler] Dispatched scheduled broadcast "${item.title}" to ${result.deliveredCount} devices.`);
    } catch (err) {
      console.error(`[PushScheduler] Error dispatching scheduled notification "${item.id}":`, err);
      item.status = 'failed';
      item.error = err.message;
    }
  }

  if (due.length > 0) {
    // Retain pending items and last 30 completed/cancelled items
    const pending = memoryStore.scheduledNotifications.filter(n => n.status === 'pending');
    const past = memoryStore.scheduledNotifications.filter(n => n.status !== 'pending').slice(-30);
    memoryStore.scheduledNotifications = [...pending, ...past];
    scheduleFlush();
  }
}

// Compute Statistics for Admin Dashboard
export function getAdminDashboardStats({ startDate, endDate } = {}) {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const todayKey = getTodayKey();

  const allUsersList = Object.values(memoryStore.users).filter(u => u && !u.isAdmin);
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
  const calcRate = (count, total) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 1000) / 10;
  };

  const getDiffStats = (diff) => {
    const total = botStats[diff]?.total || 0;
    const userWins = botStats[diff]?.userWins || 0;
    const botWins = botStats[diff]?.botWins || 0;
    const rawDraws = botStats[diff]?.draws !== undefined
      ? botStats[diff].draws
      : Math.max(0, total - userWins - botWins);
    const draws = Math.max(rawDraws, Math.max(0, total - userWins - botWins));

    return {
      total,
      userWins,
      botWins,
      draws,
      userWinRate: calcRate(userWins, total),
      botWinRate: calcRate(botWins, total),
      drawRate: calcRate(draws, total)
    };
  };

  const botOverview = {
    totalMatches: botStats.totalMatches || 0,
    beginner: getDiffStats('beginner'),
    intermediate: getDiffStats('intermediate'),
    pro: getDiffStats('pro')
  };

  // Match durations and room size
  const avgBotDurationSeconds = (botStats.matchesWithDuration && botStats.matchesWithDuration > 0)
    ? Math.round((botStats.totalDurationMs || 0) / botStats.matchesWithDuration / 1000)
    : 0;

  const avgMultiplayerDurationSeconds = (memoryStore.multiplayerStats?.matchesWithDuration && memoryStore.multiplayerStats.matchesWithDuration > 0)
    ? Math.round((memoryStore.multiplayerStats.totalDurationMs || 0) / memoryStore.multiplayerStats.matchesWithDuration / 1000)
    : 0;

  const avgRoomSize = (memoryStore.multiplayerStats?.roomsSampledForSize && memoryStore.multiplayerStats.roomsSampledForSize > 0)
    ? Math.round(((memoryStore.multiplayerStats.totalPlayerSlots || 0) / memoryStore.multiplayerStats.roomsSampledForSize) * 10) / 10
    : (memoryStore.multiplayerStats?.roomsCreated > 0 ? 2.0 : 0);

  // Push funnel analytics
  const funnel = memoryStore.pushFunnel || {
    promptsShown: 0,
    promptsGranted: 0,
    promptsDenied: 0,
    totalClicks: 0,
    totalConversions: 0
  };

  const totalPushSubscribers = Object.keys(memoryStore.pushSubscriptions || {}).length;
  const optInRate = funnel.promptsShown > 0
    ? Math.round((funnel.promptsGranted / funnel.promptsShown) * 1000) / 10
    : (totalPushSubscribers > 0 ? 100 : 0);

  const totalDeliveredAcrossHistory = (memoryStore.notificationsHistory || []).reduce(
    (acc, item) => acc + (item.deliveredCount || 0),
    0
  );

  const overallCtr = totalDeliveredAcrossHistory > 0
    ? Math.round((funnel.totalClicks / totalDeliveredAcrossHistory) * 1000) / 10
    : 0;

  const overallConversionRate = funnel.totalClicks > 0
    ? Math.round((funnel.totalConversions / funnel.totalClicks) * 1000) / 10
    : 0;

  const pushFunnelStats = {
    promptsShown: funnel.promptsShown || 0,
    promptsGranted: funnel.promptsGranted || 0,
    promptsDenied: funnel.promptsDenied || 0,
    optInRate,
    totalClicks: funnel.totalClicks || 0,
    totalConversions: funnel.totalConversions || 0,
    overallCtr,
    overallConversionRate,
    totalDelivered: totalDeliveredAcrossHistory
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
      totalPushSubscribers,
      totalRoomsCreated: memoryStore.multiplayerStats?.roomsCreated || 0,
      totalMatchesCompleted: memoryStore.multiplayerStats?.matchesCompleted || 0,
      avgBotDurationSeconds,
      avgMultiplayerDurationSeconds,
      avgRoomSize,
      pushFunnel: pushFunnelStats
    },
    todayHourlyActivity: todayHourly,
    activityTimeline: timelineDays,
    botOverview,
    multiplayerStats: memoryStore.multiplayerStats,
    pushFunnel: pushFunnelStats,
    persistenceStatus: {
      type: isDbConnected() ? 'postgres' : 'ephemeral',
      isConnected: isDbConnected(),
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      dbError: getDbError()
    }
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

  const pushId = `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = JSON.stringify({
    id: pushId,
    pushId,
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
    id: pushId,
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

// Export complete store payload for Admin backup
export function getBackupPayload() {
  return {
    version: '2.5.7',
    timestamp: Date.now(),
    users: memoryStore.users,
    hourlyActivity: memoryStore.hourlyActivity,
    dailyUniqueUsers: memoryStore.dailyUniqueUsers,
    botStats: memoryStore.botStats,
    multiplayerStats: memoryStore.multiplayerStats,
    pushSubscriptions: memoryStore.pushSubscriptions,
    notificationsHistory: memoryStore.notificationsHistory,
    scheduledNotifications: memoryStore.scheduledNotifications || [],
    schedulingNotices: memoryStore.schedulingNotices || [],
    aiAutoPilot: memoryStore.aiAutoPilot || defaultState.aiAutoPilot,
    pushFunnel: memoryStore.pushFunnel || defaultState.pushFunnel
  };
}

// Restore & merge backup snapshot to memory store and disk
export function restoreBackupData(backupData) {
  if (!backupData || typeof backupData !== 'object') return false;

  // 1. Merge users
  if (backupData.users && typeof backupData.users === 'object') {
    memoryStore.users = {
      ...memoryStore.users,
      ...backupData.users
    };
  }

  // 2. Merge bot stats with maximums so no counts are ever reduced
  if (backupData.botStats && typeof backupData.botStats === 'object') {
    for (const diff of ['beginner', 'intermediate', 'pro']) {
      const src = backupData.botStats[diff];
      if (src) {
        if (!memoryStore.botStats[diff]) {
          memoryStore.botStats[diff] = { total: 0, userWins: 0, botWins: 0, draws: 0 };
        }
        memoryStore.botStats[diff].total = Math.max(memoryStore.botStats[diff].total || 0, src.total || 0);
        memoryStore.botStats[diff].userWins = Math.max(memoryStore.botStats[diff].userWins || 0, src.userWins || 0);
        memoryStore.botStats[diff].botWins = Math.max(memoryStore.botStats[diff].botWins || 0, src.botWins || 0);
        const srcDraws = src.draws !== undefined ? src.draws : Math.max(0, (src.total || 0) - (src.userWins || 0) - (src.botWins || 0));
        const curDraws = Math.max(memoryStore.botStats[diff].draws || 0, srcDraws);
        memoryStore.botStats[diff].draws = Math.max(curDraws, Math.max(0, memoryStore.botStats[diff].total - memoryStore.botStats[diff].userWins - memoryStore.botStats[diff].botWins));
      }
    }
    const computedTotal = (memoryStore.botStats.beginner?.total || 0) + (memoryStore.botStats.intermediate?.total || 0) + (memoryStore.botStats.pro?.total || 0);
    memoryStore.botStats.totalMatches = Math.max(
      memoryStore.botStats.totalMatches || 0,
      backupData.botStats.totalMatches || 0,
      computedTotal
    );
  }

  // 3. Merge push subscriptions
  if (backupData.pushSubscriptions && typeof backupData.pushSubscriptions === 'object') {
    memoryStore.pushSubscriptions = {
      ...memoryStore.pushSubscriptions,
      ...backupData.pushSubscriptions
    };
  }

  // 4. Merge notifications history
  if (Array.isArray(backupData.notificationsHistory)) {
    const existingIds = new Set(memoryStore.notificationsHistory.map(n => n.id));
    for (const notif of backupData.notificationsHistory) {
      if (notif && notif.id && !existingIds.has(notif.id)) {
        memoryStore.notificationsHistory.push(notif);
        existingIds.add(notif.id);
      }
    }
    memoryStore.notificationsHistory.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
  }

  // 5. Merge scheduled notifications
  if (Array.isArray(backupData.scheduledNotifications)) {
    if (!memoryStore.scheduledNotifications) memoryStore.scheduledNotifications = [];
    const existingSchedIds = new Set(memoryStore.scheduledNotifications.map(s => s.id));
    for (const sched of backupData.scheduledNotifications) {
      if (sched && sched.id && !existingSchedIds.has(sched.id)) {
        memoryStore.scheduledNotifications.push(sched);
        existingSchedIds.add(sched.id);
      }
    }
    memoryStore.scheduledNotifications.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  // 6. Merge multiplayer stats
  if (backupData.multiplayerStats) {
    memoryStore.multiplayerStats.roomsCreated = Math.max(
      memoryStore.multiplayerStats.roomsCreated || 0,
      backupData.multiplayerStats.roomsCreated || 0
    );
    memoryStore.multiplayerStats.matchesCompleted = Math.max(
      memoryStore.multiplayerStats.matchesCompleted || 0,
      backupData.multiplayerStats.matchesCompleted || 0
    );
  }

  // 7. Merge push funnel
  if (backupData.pushFunnel && typeof backupData.pushFunnel === 'object') {
    if (!memoryStore.pushFunnel) memoryStore.pushFunnel = { ...defaultState.pushFunnel };
    memoryStore.pushFunnel.promptsShown = Math.max(memoryStore.pushFunnel.promptsShown || 0, backupData.pushFunnel.promptsShown || 0);
    memoryStore.pushFunnel.promptsGranted = Math.max(memoryStore.pushFunnel.promptsGranted || 0, backupData.pushFunnel.promptsGranted || 0);
    memoryStore.pushFunnel.promptsDenied = Math.max(memoryStore.pushFunnel.promptsDenied || 0, backupData.pushFunnel.promptsDenied || 0);
    memoryStore.pushFunnel.totalClicks = Math.max(memoryStore.pushFunnel.totalClicks || 0, backupData.pushFunnel.totalClicks || 0);
    memoryStore.pushFunnel.totalConversions = Math.max(memoryStore.pushFunnel.totalConversions || 0, backupData.pushFunnel.totalConversions || 0);
  }

  // 8. Merge AI Auto-Pilot & Scheduling Notices
  if (backupData.aiAutoPilot && typeof backupData.aiAutoPilot === 'object') {
    memoryStore.aiAutoPilot = {
      ...defaultState.aiAutoPilot,
      ...(memoryStore.aiAutoPilot || {}),
      ...backupData.aiAutoPilot
    };
  }
  if (Array.isArray(backupData.schedulingNotices)) {
    if (!memoryStore.schedulingNotices) memoryStore.schedulingNotices = [];
    const existingNoticeIds = new Set(memoryStore.schedulingNotices.map(n => n.id));
    for (const notice of backupData.schedulingNotices) {
      if (notice && notice.id && !existingNoticeIds.has(notice.id)) {
        memoryStore.schedulingNotices.push(notice);
        existingNoticeIds.add(notice.id);
      }
    }
  }

  // Re-aggregate and flush to disk
  recomputeAggregatedBotStats();
  flushToDisk();

  // Also sync all restored data to PostgreSQL cloud database
  if (isDbConnected()) {
    saveMultipleKeysToDatabase({
      users: memoryStore.users,
      hourly_activity: memoryStore.hourlyActivity,
      daily_unique_users: memoryStore.dailyUniqueUsers,
      bot_stats: memoryStore.botStats,
      multiplayer_stats: memoryStore.multiplayerStats,
      push_subscriptions: memoryStore.pushSubscriptions,
      notifications_history: memoryStore.notificationsHistory,
      scheduled_notifications: memoryStore.scheduledNotifications,
      scheduling_notices: memoryStore.schedulingNotices,
      ai_auto_pilot: memoryStore.aiAutoPilot,
      push_funnel: memoryStore.pushFunnel,
      admin_security: memoryStore.adminSecurity
    }).catch(err => console.error('[Restore] PostgreSQL sync error:', err.message));
  }
  return true;
}

// Initialize on module import
loadStore();

// Start recurring background scheduler (checks every 20 seconds for due notifications & auto-pilot tick)
setInterval(() => {
  processDueScheduledNotifications().catch(err => {
    console.error('[PushScheduler] Background job error:', err);
  });
  processAiAutoPilotTick().catch(err => {
    console.error('[AiAutoPilot] Background ticker error:', err);
  });
}, 20000);
