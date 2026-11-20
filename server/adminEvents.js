// Admin event log: a small in-memory ring buffer of what the server did (rooms opened and closed,
// rounds, rejoins, pushes, errors), read by the admin dashboard. The newest 200 entries are handed
// to the store on a debounce so a restart keeps recent history. Nothing here ever throws.
const MAX_EVENTS = 500;
const PERSIST_COUNT = 200;
const PERSIST_DEBOUNCE_MS = 3000;
const LEVELS = ['info', 'warn', 'error'];

let events = []; // oldest first
let seq = 0;
let persistTimer = null;
let persistFn = null;

function cleanMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    // Never let credentials or cards into the admin log, whatever the caller passed.
    if (key === 'token' || key === 'board' || key === 'markedCells') continue;
    out[key] = value;
  }
  return out;
}

function schedulePersist() {
  if (!persistFn || persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const result = persistFn(events.slice(-PERSIST_COUNT));
      if (result && typeof result.catch === 'function') {
        result.catch(err => console.warn('[AdminEvents] Persist failed:', err.message));
      }
    } catch (err) {
      console.warn('[AdminEvents] Persist failed:', err.message);
    }
  }, PERSIST_DEBOUNCE_MS);
}

export function logEvent(level, type, message, meta) {
  try {
    const cleaned = cleanMeta(meta);
    const event = {
      id: ++seq,
      at: Date.now(),
      level: LEVELS.includes(level) ? level : 'info',
      type: String(type || 'event'),
      message: String(message || ''),
      roomId: typeof cleaned.roomId === 'string' ? cleaned.roomId : null,
      meta: cleaned
    };
    events.push(event);
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    schedulePersist();
    return event;
  } catch (err) {
    console.warn('[AdminEvents] Could not log event:', err.message);
    return null;
  }
}

// Newest first. `q` matches case-insensitively across type, message, roomId and the meta JSON.
export function getEvents({ limit = 300, q = '', level = '' } = {}) {
  const max = Math.min(MAX_EVENTS, Math.max(1, parseInt(limit, 10) || 300));
  const needle = String(q || '').trim().toLowerCase();
  const wantLevel = LEVELS.includes(level) ? level : null;
  const out = [];
  for (let i = events.length - 1; i >= 0 && out.length < max; i--) {
    const e = events[i];
    if (wantLevel && e.level !== wantLevel) continue;
    if (needle) {
      let metaText = '';
      try { metaText = JSON.stringify(e.meta || {}); } catch {}
      const hay = `${e.type}\n${e.message}\n${e.roomId || ''}\n${metaText}`.toLowerCase();
      if (!hay.includes(needle)) continue;
    }
    out.push(e);
  }
  return out;
}

// The store hands back what it saved on boot. Events logged before the store was ready (for
// example server-started) are kept; everything is re-numbered in time order.
export function restoreEvents(saved) {
  try {
    if (!Array.isArray(saved) || saved.length === 0) return 0;
    const valid = saved.filter(e => e && typeof e === 'object' && typeof e.at === 'number' && typeof e.type === 'string');
    const merged = [...valid.slice(-PERSIST_COUNT), ...events]
      .sort((a, b) => a.at - b.at)
      .slice(-MAX_EVENTS)
      .map(e => ({
        id: 0,
        at: e.at,
        level: LEVELS.includes(e.level) ? e.level : 'info',
        type: e.type,
        message: typeof e.message === 'string' ? e.message : '',
        roomId: typeof e.roomId === 'string' ? e.roomId : null,
        meta: cleanMeta(e.meta)
      }));
    merged.forEach((e, i) => { e.id = i + 1; });
    events = merged;
    seq = merged.length;
    return valid.length;
  } catch (err) {
    console.warn('[AdminEvents] Could not restore events:', err.message);
    return 0;
  }
}

export function setEventPersistence(fn) {
  persistFn = typeof fn === 'function' ? fn : null;
  if (persistFn && events.length) schedulePersist();
}

export function eventsBuffered() {
  return events.length;
}
