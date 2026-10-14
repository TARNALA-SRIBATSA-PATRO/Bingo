import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { registerPushNotifications, getPushSubscriptionState } from '../services/analytics';

/**
 * Direct System Push Notification Prompt
 * Immediately triggers the browser/OS native "Allow / Block" system prompt directly
 * without any intermediate in-app soft banner.
 *
 * Rules:
 * - Only asks if Notification.permission === 'default' (not yet answered).
 * - Only asks on Home (/) or Lobby (/lobby) - never in game or board setup.
 * - Dismissed for current session if user rejects or closes native prompt.
 * - Re-prompts on next app restart / new session.
 */
export default function PushNotificationPrompt() {
  const location = useLocation();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only trigger on safe, calm screens
    const isSafeRoute = location.pathname === '/' || location.pathname === '/lobby';
    if (!isSafeRoute) return;

    // Check if already asked in this session
    try {
      if (sessionStorage.getItem('bingo_push_direct_prompted') === 'true') {
        return;
      }
    } catch {}

    let cleanup = () => {};

    async function triggerSystemPrompt() {
      if (hasTriggeredRef.current) return;

      const state = await getPushSubscriptionState();
      if (!state.supported || state.permission !== 'default') {
        return;
      }

      hasTriggeredRef.current = true;
      try {
        sessionStorage.setItem('bingo_push_direct_prompted', 'true');
      } catch {}

      try {
        // Direct call to native browser / OS permission dialog
        await registerPushNotifications();
      } catch (err) {
        console.warn('[Push] Native prompt error:', err);
      }
    }

    // Attempt direct prompt after a brief 1.2s page settle
    const settleTimer = setTimeout(() => {
      triggerSystemPrompt();
    }, 1200);

    // Also attach to first user tap/click to satisfy browsers with strict user-gesture policies
    const onUserGesture = () => {
      triggerSystemPrompt();
    };

    window.addEventListener('click', onUserGesture, { once: true });
    window.addEventListener('touchstart', onUserGesture, { once: true });

    cleanup = () => {
      clearTimeout(settleTimer);
      window.removeEventListener('click', onUserGesture);
      window.removeEventListener('touchstart', onUserGesture);
    };

    return cleanup;
  }, [location.pathname]);

  // Render nothing: directly display the system default dialog
  return null;
}
