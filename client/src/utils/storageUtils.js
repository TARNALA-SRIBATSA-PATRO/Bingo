/**
 * Resilient multi-tiered storage utility for PWA & Bingo settings.
 * Stores data across localStorage, IndexedDB, and persistent Cookies
 * with automatic self-healing rehydration and Persistent Storage API support.
 */

const DB_NAME = 'BingoAppPersistentDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_settings';
const STORAGE_KEY_NAME = 'bingo_persistent_player_name';
const STORAGE_KEY_DECLINED = 'bingo_name_prompt_declined';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// IndexedDB Helpers
export async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Cookie Helpers
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function setCookie(name, value, days = 3650) {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

// Request Persistent Storage quota from browser/OS
export async function requestPersistentStorage() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

// Detect if app is currently installed / running in standalone mode
export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
  );
}

// Retrieve persistent player name with multi-tier rehydration
export async function getPersistentPlayerName() {
  let name = null;

  // 1. Check localStorage
  try {
    name = localStorage.getItem(STORAGE_KEY_NAME);
  } catch {}

  // 2. Check Cookie
  if (!name) {
    name = getCookie(STORAGE_KEY_NAME);
  }

  // 3. Check IndexedDB
  if (!name) {
    name = await idbGet('player_name');
  }

  // Self-heal: ensure all storage tiers have the value
  if (name && typeof name === 'string' && name.trim()) {
    name = name.trim();
    try { localStorage.setItem(STORAGE_KEY_NAME, name); } catch {}
    setCookie(STORAGE_KEY_NAME, name);
    idbSet('player_name', name);
    return name;
  }

  return '';
}

// Synchronous fast getter (checks localStorage & Cookie)
export function getPersistentPlayerNameSync() {
  try {
    const local = localStorage.getItem(STORAGE_KEY_NAME);
    if (local && local.trim()) return local.trim();
  } catch {}

  const cookie = getCookie(STORAGE_KEY_NAME);
  if (cookie && cookie.trim()) return cookie.trim();

  return '';
}

// Store persistent player name across all storage tiers
export async function setPersistentPlayerName(name) {
  if (!name || typeof name !== 'string') return;
  const cleanName = name.trim();
  if (!cleanName) return;

  // 1. localStorage
  try {
    localStorage.setItem(STORAGE_KEY_NAME, cleanName);
  } catch {}

  // 2. Cookie (10 years)
  setCookie(STORAGE_KEY_NAME, cleanName);

  // 3. IndexedDB
  await idbSet('player_name', cleanName);

  // 4. Request OS/Browser to not evict storage
  await requestPersistentStorage();
}

// Check if user has declined the initial install name prompt
export async function isNamePromptDeclined() {
  try {
    if (localStorage.getItem(STORAGE_KEY_DECLINED) === 'true') return true;
  } catch {}

  if (getCookie(STORAGE_KEY_DECLINED) === 'true') return true;

  const idbVal = await idbGet('name_prompt_declined');
  return idbVal === true;
}

// Mark install name prompt as declined so user is not prompted again
export async function setNamePromptDeclined() {
  try {
    localStorage.setItem(STORAGE_KEY_DECLINED, 'true');
  } catch {}

  setCookie(STORAGE_KEY_DECLINED, 'true');
  await idbSet('name_prompt_declined', true);
}
