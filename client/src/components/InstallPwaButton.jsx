import React, { useState, useEffect } from 'react';
import './InstallPwaButton.css';

// Capture prompt early in case event fires before component mounts
let savedDeferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    savedDeferredPrompt = e;
  });
}

const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(savedDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('bingo_pwa_dismissed') === 'true') {
      setIsDismissed(true);
    }

    // Check iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIosDevice(isIos);

    // Event listener for Chromium browsers
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      savedDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      savedDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIosGuide((prev) => !prev);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      savedDeferredPrompt = null;
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('bingo_pwa_dismissed', 'true');
  };

  // If already installed or dismissed, do not render
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if prompt is available (Android/Desktop) or on iOS Safari
  if (!deferredPrompt && !isIosDevice) {
    return null;
  }

  return (
    <div className="pwa-install-container" role="region" aria-label="Install App">
      {showIosGuide && (
        <div className="pwa-ios-guide">
          <div className="pwa-ios-guide-header">
            <span className="pwa-ios-title">Install Bingo App</span>
            <button 
              className="pwa-ios-close" 
              onClick={() => setShowIosGuide(false)}
              aria-label="Close instructions"
            >
              ✕
            </button>
          </div>
          <p className="pwa-ios-text">
            Install this app on your iPhone or iPad:
          </p>
          <ol className="pwa-ios-steps">
            <li>
              Tap the <strong>Share</strong> button{' '}
              <svg className="pwa-ios-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
              </svg>
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen ➕</strong>
            </li>
          </ol>
          <button className="pwa-ios-done-btn" onClick={() => setShowIosGuide(false)}>
            Got it
          </button>
        </div>
      )}

      <div className="pwa-install-button-wrapper">
        <button 
          className="pwa-install-btn" 
          onClick={handleInstallClick}
          title="Install Bingo as a standalone app"
          aria-label="Install Bingo App"
        >
          <span className="pwa-install-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span className="pwa-install-label">Install App</span>
        </button>

        <button 
          className="pwa-dismiss-btn" 
          onClick={handleDismiss}
          title="Dismiss install prompt"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InstallPwaButton;
