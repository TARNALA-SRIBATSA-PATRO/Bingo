import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const AudioContext = createContext(null);

const STORAGE_KEY = 'bingo_bgm_muted';
const LOBBY_TRACK = '/sounds/bgm-lobby%20and%20home.mp3';
const GAME_TRACK = '/sounds/bgm-game.mp3';
const DEFAULT_VOLUME = 0.35;

/**
 * Suppress mobile OS media notification drawer / lock screen media banners.
 * Tells Android / iOS that this background music should NOT create a system media controller.
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

  // Dedicated audio instances for 0ms transition switching
  const lobbyAudioRef = useRef(null);
  const gameAudioRef = useRef(null);

  // Initialize audio tracks on mount
  useEffect(() => {
    suppressMediaNotification();

    const lobbyAudio = new Audio(LOBBY_TRACK);
    lobbyAudio.loop = true;
    lobbyAudio.volume = DEFAULT_VOLUME;
    lobbyAudio.preload = 'auto';

    const gameAudio = new Audio(GAME_TRACK);
    gameAudio.loop = true;
    gameAudio.volume = DEFAULT_VOLUME;
    gameAudio.preload = 'auto';

    lobbyAudioRef.current = lobbyAudio;
    gameAudioRef.current = gameAudio;

    lobbyAudio.load();
    gameAudio.load();

    const updatePlayingState = () => {
      const isGame = window.location.pathname === '/board-setup' || window.location.pathname === '/game';
      const active = isGame ? gameAudio : lobbyAudio;
      setIsPlaying(!active.paused);
      suppressMediaNotification();
    };

    lobbyAudio.addEventListener('play', updatePlayingState);
    lobbyAudio.addEventListener('pause', updatePlayingState);
    gameAudio.addEventListener('play', updatePlayingState);
    gameAudio.addEventListener('pause', updatePlayingState);

    return () => {
      lobbyAudio.removeEventListener('play', updatePlayingState);
      lobbyAudio.removeEventListener('pause', updatePlayingState);
      gameAudio.removeEventListener('play', updatePlayingState);
      gameAudio.removeEventListener('pause', updatePlayingState);

      lobbyAudio.pause();
      lobbyAudio.src = '';
      gameAudio.pause();
      gameAudio.src = '';
      suppressMediaNotification();
    };
  }, []);

  // Determine active track by route
  const isGameSession = location.pathname === '/board-setup' || location.pathname === '/game';

  // Track switching on route transition or mute state changes
  useEffect(() => {
    const lobbyAudio = lobbyAudioRef.current;
    const gameAudio = gameAudioRef.current;
    if (!lobbyAudio || !gameAudio) return;

    const activeAudio = isGameSession ? gameAudio : lobbyAudio;
    const inactiveAudio = isGameSession ? lobbyAudio : gameAudio;

    // Immediately stop inactive track
    if (!inactiveAudio.paused) {
      inactiveAudio.pause();
      inactiveAudio.currentTime = 0;
    }

    if (isMuted) {
      if (!activeAudio.paused) {
        activeAudio.pause();
      }
      setIsPlaying(false);
      suppressMediaNotification();
      return;
    }

    // Do not auto-play if the page is currently in the background or screen is locked
    if (document.hidden || document.visibilityState === 'hidden') {
      if (!activeAudio.paused) activeAudio.pause();
      setIsPlaying(false);
      suppressMediaNotification();
      return;
    }

    // Play active track if unmuted and tab is visible
    if (activeAudio.paused) {
      activeAudio.play()
        .then(() => {
          setIsPlaying(true);
          suppressMediaNotification();
        })
        .catch(() => {
          setIsPlaying(false);
          const resumeOnInteract = () => {
            if (!document.hidden) {
              activeAudio.play().then(() => {
                setIsPlaying(true);
                suppressMediaNotification();
              }).catch(() => {});
            }
            window.removeEventListener('pointerdown', resumeOnInteract);
            window.removeEventListener('keydown', resumeOnInteract);
          };
          window.addEventListener('pointerdown', resumeOnInteract, { once: true });
          window.addEventListener('keydown', resumeOnInteract, { once: true });
        });
    }
  }, [isGameSession, isMuted]);

  // STOP MUSIC IMMEDIATELY when Home button is clicked, app goes to background, or screen is locked
  useEffect(() => {
    const handleVisibilityChange = () => {
      const lobbyAudio = lobbyAudioRef.current;
      const gameAudio = gameAudioRef.current;
      if (!lobbyAudio || !gameAudio) return;

      const isGame = window.location.pathname === '/board-setup' || window.location.pathname === '/game';
      const activeAudio = isGame ? gameAudio : lobbyAudio;

      if (document.hidden || document.visibilityState === 'hidden') {
        // User pressed Home button, switched apps, or locked phone screen!
        // Immediately silence all audio tracks
        if (lobbyAudio && !lobbyAudio.paused) lobbyAudio.pause();
        if (gameAudio && !gameAudio.paused) gameAudio.pause();
        setIsPlaying(false);
        suppressMediaNotification();
      } else {
        // User returned to app or unlocked phone screen
        // Resume ONLY if sound is not muted
        if (!isMuted && activeAudio) {
          activeAudio.play()
            .then(() => {
              setIsPlaying(true);
              suppressMediaNotification();
            })
            .catch(() => {});
        }
      }
    };

    const handlePageHide = () => {
      const lobbyAudio = lobbyAudioRef.current;
      const gameAudio = gameAudioRef.current;
      if (lobbyAudio && !lobbyAudio.paused) lobbyAudio.pause();
      if (gameAudio && !gameAudio.paused) gameAudio.pause();
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
  }, [isMuted]);

  // Toggle mute button handler (triggered by user gesture)
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      const lobbyAudio = lobbyAudioRef.current;
      const gameAudio = gameAudioRef.current;
      const isGame = window.location.pathname === '/board-setup' || window.location.pathname === '/game';
      const activeAudio = isGame ? gameAudio : lobbyAudio;
      const inactiveAudio = isGame ? lobbyAudio : gameAudio;

      if (inactiveAudio) {
        inactiveAudio.pause();
        inactiveAudio.currentTime = 0;
      }

      if (activeAudio) {
        if (next) {
          activeAudio.pause();
          setIsPlaying(false);
          suppressMediaNotification();
        } else {
          // Only play if tab is currently visible
          if (!document.hidden) {
            activeAudio.play()
              .then(() => {
                setIsPlaying(true);
                suppressMediaNotification();
              })
              .catch(() => {});
          }
        }
      }

      return next;
    });
  }, []);

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
