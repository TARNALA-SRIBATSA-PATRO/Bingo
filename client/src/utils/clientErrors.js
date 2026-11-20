// Reports unexpected client errors to the server so they show up in the admin
// event log. Capped per session and never throws itself.

const MAX_PER_SESSION = 5;
let sent = 0;
const seen = new Set();

export function reportClientError(kind, error, extra = {}) {
  try {
    if (sent >= MAX_PER_SESSION) return;
    const message = String((error && (error.message || error.reason)) || error || 'Unknown error').slice(0, 300);
    const stack = String((error && error.stack) || '').split('\n').slice(0, 4).join('\n').slice(0, 600);
    const key = kind + '|' + message;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;
    const body = JSON.stringify({
      event: 'client_error',
      kind,
      message,
      stack,
      path: window.location.pathname,
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
      ua: navigator.userAgent.slice(0, 160),
      ...extra
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/analytics/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

export function installGlobalErrorReporting() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    // Resource load failures have no error object and are noise here.
    if (!e.error && e.target && e.target !== window) return;
    reportClientError('error', e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    reportClientError('unhandledrejection', e.reason);
  });
}
