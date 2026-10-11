import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const AudioContext = createContext(null);

const STORAGE_KEY = 'bingo_bgm_muted';
const LOBBY_TRACK = '/sounds/bgm-lobby%20and%20home.mp3';
const GAME_TRACK = '/sounds/bgm-game.mp3';
const DEFAULT_VOLUME = 0.35;

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

  // Dedicated, preloaded audio instances for 0ms delay switching
  const lobbyAudioRef = useRef(null);
  const gameAudioRef = useRef(null);

  // Initialize and preload audio tracks on mount
  useEffect(() => {
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
    };
  }, []);

  // Determine section: in game session (/board-setup or /game) vs home/lobby
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
      return;
    }

    // Play active track if unmuted
    if (activeAudio.paused) {
      activeAudio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          const resumeOnInteract = () => {
            activeAudio.play().then(() => setIsPlaying(true)).catch(() => {});
            window.removeEventListener('pointerdown', resumeOnInteract);
            window.removeEventListener('keydown', resumeOnInteract);
          };
          window.addEventListener('pointerdown', resumeOnInteract, { once: true });
          window.addEventListener('keydown', resumeOnInteract, { once: true });
        });
    }
  }, [isGameSession, isMuted]);

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
        } else {
          activeAudio.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
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
