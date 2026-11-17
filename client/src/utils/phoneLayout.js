// When the installed app is opened on a phone whose browser has "Desktop site"
// switched on, the browser ignores the viewport meta and lays the page out at
// about 980px wide. Media queries then pick the desktop layout and everything
// renders tiny. There is no API to turn desktop mode off, so the app compensates:
// it zooms the root so the layout width matches a phone, and adds classes that
// turn on the same rules the width-based media queries would have (the build
// duplicates every `@media (max-width: Npx)` block under `html.phone-N`, see
// vite.config.js). Viewport units in CSS divide by --zoom to stay correct.

export const PHONE_BREAKPOINTS = [380, 440, 480, 600, 640, 768, 900, 980, 1024];

const PORTRAIT_TARGET = 412;   // typical phone CSS width
const MAX_PHYSICAL_WIDTH = 1500; // phones top out around 1440 physical px on the short side

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

function looksLikePhone() {
  if (typeof window === 'undefined') return false;
  const touch = (navigator.maxTouchPoints || 0) > 0 && window.matchMedia('(pointer: coarse)').matches;
  if (!touch) return false;
  const dpr = window.devicePixelRatio || 1;
  const shortSide = Math.min(window.screen.width, window.screen.height) * dpr;
  return shortSide > 0 && shortSide <= MAX_PHYSICAL_WIDTH;
}

export function getLayoutZoom() {
  if (typeof window === 'undefined') return 1;
  const v = parseFloat(document.documentElement.style.getPropertyValue('--zoom'));
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function clearPhoneLayout(root) {
  root.classList.remove('force-phone');
  PHONE_BREAKPOINTS.forEach(n => root.classList.remove(`phone-${n}`));
  root.style.removeProperty('--zoom');
  root.style.zoom = '';
}

export function applyPhoneLayout() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const wide = window.innerWidth > 600;

  if (!isStandalone() || !looksLikePhone() || !wide) {
    clearPhoneLayout(root);
    return;
  }

  const portrait = window.innerHeight >= window.innerWidth;
  const target = portrait
    ? PORTRAIT_TARGET
    : Math.min(915, Math.round(PORTRAIT_TARGET * (window.innerWidth / window.innerHeight)));
  const zoom = Math.round((window.innerWidth / target) * 1000) / 1000;

  root.classList.add('force-phone');
  PHONE_BREAKPOINTS.forEach(n => root.classList.toggle(`phone-${n}`, target <= n));
  root.style.setProperty('--zoom', String(zoom));
  root.style.zoom = String(zoom);
}

export function installPhoneLayout() {
  if (typeof window === 'undefined') return;
  applyPhoneLayout();
  let timer = null;
  const rerun = () => {
    clearTimeout(timer);
    timer = setTimeout(applyPhoneLayout, 120);
  };
  window.addEventListener('resize', rerun);
  window.addEventListener('orientationchange', rerun);
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', rerun);
  } catch {}
}
