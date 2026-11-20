import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import SoundMenu from './SoundMenu';
import { ShareIcon, DownloadIcon } from './Icons';
import { getDeferredInstallPrompt, clearDeferredInstallPrompt } from './InstallPwaButton';
import { registerPushNotifications } from '../services/analytics';
import './TopActions.css';

const SHARE_TEXT = 'Play 5x5 bingo with me in the browser. Free, no sign-up.';

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

function isIos() {
  const ua = (navigator.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
}

// Top-right cluster on the home, lobby, rules and legal pages:
// install the app (when the browser allows it), share the app, sound.
export default function TopActions() {
  const { showNotif } = useGame() || {};
  const [canInstall, setCanInstall] = useState(() => !isStandalone() && (Boolean(getDeferredInstallPrompt()) || isIos()));

  useEffect(() => {
    if (isStandalone()) { setCanInstall(false); return; }
    const onPrompt = () => setCanInstall(true);
    const onInstalled = () => setCanInstall(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = getDeferredInstallPrompt();
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setCanInstall(false);
          setTimeout(() => registerPushNotifications().catch(() => {}), 1500);
        }
      } catch {}
      clearDeferredInstallPrompt();
      return;
    }
    if (isIos()) {
      showNotif?.('In Safari, tap Share, then Add to Home Screen.', 'info', 6000);
      return;
    }
    showNotif?.('Open the browser menu and choose Install app.', 'info', 5000);
  };

  const handleShare = async () => {
    const url = window.location.origin + '/';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bingo', text: SHARE_TEXT, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      showNotif?.('Link copied.', 'success');
    } catch {
      showNotif?.(url, 'info', 6000);
    }
  };

  return (
    <div className="top-actions">
      {canInstall && (
        <button className="icon-btn" onClick={handleInstall} type="button" title="Install app" aria-label="Install app">
          <DownloadIcon size={18} />
        </button>
      )}
      <button className="icon-btn" onClick={handleShare} type="button" title="Share app" aria-label="Share app">
        <ShareIcon size={17} />
      </button>
      <SoundMenu />
    </div>
  );
}
