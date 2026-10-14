import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const AudioContext = createContext(null);

const STORAGE_KEY = 'bingo_bgm_muted';
const LOBBY_TRACK = '/sounds/bgm-lobby%20and%20home.mp3';
const GAME_TRACK = '/sounds/bgm-game.mp3';
const DEFAULT_VOLUME = 0.35;

/**
 * Suppress mobile OS media notification drawer / lock screen media banners.
 * Tells Android / iOS that this background sound should NOT create a system media controller.
 */
function suppressMediaNotification() {
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
      const actions = ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'stop'];
      actions.forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    } catch {}
  }
}

// Global Web Audio Context singleton & in-memory decoded buffer cache.
// Using Web Audio API (AudioBufferSourceNode) ensures Chrome on Android treats audio
// strictly as game/app SFX, completely preventing Android from generating a Quick Settings /
// notification drawer media playback card.
let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
}

const bufferCache = {
  lobby: null,
  game: null
};

const bufferPromises = {
  lobby: null,
  game: null
};

function fetchAndDecode(trackKey, url, ctx) {
  if (bufferCache[trackKey]) return Promise.resolve(bufferCache[trackKey]);
  if (bufferPromises[trackKey]) return bufferPromises[trackKey];

  bufferPromises[trackKey] = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then(arrayBuffer => {
      return new Promise((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });
    })
    .then(decoded => {
      bufferCache[trackKey] = decoded;
      return decoded;
    })
    .catch(err => {
      console.warn(`[AudioContext] Failed to load/decode ${trackKey}:`, err);
      bufferPromises[trackKey] = null;
      return null;
    });

  return bufferPromises[trackKey];
}

export function AudioProvider({ children }) {
  const location = useLocation();

  // Initialize from localStorage; default to true (muted) on first visit
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const gainNodeRef = useRef(null);
  const currentSourceRef = useRef(null);
  const currentTrackKeyRef = useRef(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Initialize Web Audio graph
  const getGainNode = useCallback((ctx) => {
    if (!gainNodeRef.current && ctx) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
      gainNodeRef.current.gain.setValueAtTime(isMutedRef.current ? 0 : DEFAULT_VOLUME, ctx.currentTime);
    }
    return gainNodeRef.current;
  }, []);

  const stopTrack = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop(0);
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    currentTrackKeyRef.current = null;
    setIsPlaying(false);
    suppressMediaNotification();
  }, []);

  const startTrack = useCallback((trackKey) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isMutedRef.current || document.hidden || document.visibilityState === 'hidden') {
      stopTrack();
      return;
    }

    const gainNode = getGainNode(ctx);
    if (gainNode) {
      gainNode.gain.setValueAtTime(DEFAULT_VOLUME, ctx.currentTime);
    }

    // Already playing the correct track
    if (currentTrackKeyRef.current === trackKey && currentSourceRef.current) {
      setIsPlaying(true);
      return;
    }

    // Stop current track before switching
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop(0);
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }

    const buffer = bufferCache[trackKey];
    if (!buffer) {
      const trackUrl = trackKey === 'game' ? GAME_TRACK : LOBBY_TRACK;
      fetchAndDecode(trackKey, trackUrl, ctx).then(loadedBuffer => {
        if (loadedBuffer && !isMutedRef.current && !document.hidden) {
          const currentPath = window.location.pathname;
          const currentDesired = (currentPath === '/board-setup' || currentPath === '/game') ? 'game' : 'lobby';
          if (currentDesired === trackKey) {
            startTrack(trackKey);
          }
        }
      });
      return;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start(0);

      currentSourceRef.current = source;
      currentTrackKeyRef.current = trackKey;
      setIsPlaying(true);
      suppressMediaNotification();
    } catch (err) {
      console.warn('[AudioContext] Error playing buffer source:', err);
    }
  }, [getGainNode, stopTrack]);

  // Preload and decode audio buffers on mount
  useEffect(() => {
    suppressMediaNotification();
    const ctx = getAudioContext();
    if (ctx) {
      fetchAndDecode('lobby', LOBBY_TRACK, ctx);
      fetchAndDecode('game', GAME_TRACK, ctx);
    }
  }, []);

  // Determine active track by route
  const isGameSession = location.pathname === '/board-setup' || location.pathname === '/game';
  const targetTrackKey = isGameSession ? 'game' : 'lobby';

  // Handle route and mute changes
  useEffect(() => {
    const ctx = getAudioContext();
    if (isMuted) {
      stopTrack();
      if (gainNodeRef.current && ctx) {
        gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);
      }
    } else {
      if (ctx && ctx.state === 'suspended' && !document.hidden) {
        ctx.resume().catch(() => {});
      }
      startTrack(targetTrackKey);
    }
  }, [targetTrackKey, isMuted, startTrack, stopTrack]);

  // User gesture unlock listener (for mobile browser autoplay policies)
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended' && !document.hidden && !isMutedRef.current) {
        ctx.resume().then(() => {
          const path = window.location.pathname;
          const currentTarget = (path === '/board-setup' || path === '/game') ? 'game' : 'lobby';
          startTrack(currentTarget);
        }).catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [startTrack]);

  // STOP MUSIC IMMEDIATELY when Home button is clicked, app goes to background, or screen is locked
  useEffect(() => {
    const handleVisibilityChange = () => {
      const ctx = getAudioContext();
      if (document.hidden || document.visibilityState === 'hidden') {
        // User pressed Home button, switched apps, or locked phone screen!
        if (ctx && ctx.state === 'running') {
          ctx.suspend().catch(() => {});
        }
        setIsPlaying(false);
        suppressMediaNotification();
      } else {
        // User returned to app or unlocked phone screen
        if (!isMutedRef.current) {
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(() => {
              const path = window.location.pathname;
              const currentTarget = (path === '/board-setup' || path === '/game') ? 'game' : 'lobby';
              startTrack(currentTarget);
            }).catch(() => {});
          } else {
            const path = window.location.pathname;
            const currentTarget = (path === '/board-setup' || path === '/game') ? 'game' : 'lobby';
            startTrack(currentTarget);
          }
        }
      }
    };

    const handlePageHide = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'running') {
        ctx.suspend().catch(() => {});
      }
      setIsPlaying(false);
      suppressMediaNotification();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('freeze', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('freeze', handlePageHide);
    };
  }, [startTrack]);

  // Toggle mute button handler (triggered by user gesture)
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      const ctx = getAudioContext();
      if (next) {
        stopTrack();
        if (gainNodeRef.current && ctx) {
          gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);
        }
      } else {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const path = window.location.pathname;
        const currentTarget = (path === '/board-setup' || path === '/game') ? 'game' : 'lobby';
        startTrack(currentTarget);
      }

      return next;
    });
  }, [startTrack, stopTrack]);

  return (
    <AudioContext.Provider value={{
      isMuted,
      isPlaying,
      toggleMute,
      isAudioReady: true,
      hasEntered: true,
      startMusicAndEnter: () => {}
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
