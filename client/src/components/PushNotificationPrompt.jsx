import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { registerPushNotifications, getPushSubscriptionState } from '../services/analytics';
import './PushNotificationPrompt.css';

export default function PushNotificationPrompt() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    let timer = null;

    async function evaluatePrompt() {
      // 1. Check if dismissed for this active session
      try {
        if (sessionStorage.getItem('bingo_push_dismissed') === 'true') {
          return;
        }
      } catch {}

      // 2. Only show on safe routes (Home or Lobby)
      const isSafeRoute = location.pathname === '/' || location.pathname === '/lobby';
      if (!isSafeRoute) {
        setIsVisible(false);
        return;
      }

      // 3. Check push capabilities and permission status
      const state = await getPushSubscriptionState();
      if (!state.supported || state.permission !== 'default') {
        // Either unsupported, or already granted, or explicitly blocked
        return;
      }

      // 4. Polite delay: wait 3.5 seconds before presenting the soft prompt
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
    }

    evaluatePrompt();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      // Mark as dismissed for the CURRENT session only.
      // Next time the user closes and opens the app again (new session), they can be asked again.
      sessionStorage.setItem('bingo_push_dismissed', 'true');
    } catch {}
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await registerPushNotifications();
      if (result.granted) {
        setJustSubscribed(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 1600);
      } else {
        // User denied or closed the native prompt: dismiss for session
        handleDismiss();
      }
    } catch {
      handleDismiss();
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <aside 
      className={`push-prompt-banner ${justSubscribed ? 'subscribed-state' : ''}`}
      role="region"
      aria-label="Push Notification Permission Prompt"
    >
      <div className="push-prompt-glow" aria-hidden="true" />
      
      <button 
        className="push-prompt-close"
        onClick={handleDismiss}
        aria-label="Dismiss for now"
        title="Not now"
      >
        ✕
      </button>

      <div className="push-prompt-content">
        <div className="push-prompt-icon-wrapper" aria-hidden="true">
          <span className="push-prompt-bell">🔔</span>
          <span className="push-prompt-pulse" />
        </div>

        <div className="push-prompt-text">
          {justSubscribed ? (
            <>
              <h4 className="push-prompt-title success-text">Notifications Enabled! 🎉</h4>
              <p className="push-prompt-desc">You'll now receive match updates & announcements.</p>
            </>
          ) : (
            <>
              <h4 className="push-prompt-title">Never Miss a Game 🎮</h4>
              <p className="push-prompt-desc">
                Enable alerts for game invites, match turns & announcements. You can turn this off anytime.
              </p>
            </>
          )}
        </div>
      </div>

      {!justSubscribed && (
        <div className="push-prompt-actions">
          <button 
            type="button"
            className="push-prompt-btn-allow"
            onClick={handleSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing ? 'Connecting...' : 'Allow Alerts'}
          </button>
          <button 
            type="button"
            className="push-prompt-btn-later"
            onClick={handleDismiss}
            disabled={isSubscribing}
          >
            Not Now
          </button>
        </div>
      )}
    </aside>
  );
}
