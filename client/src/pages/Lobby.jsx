import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import {
  getPersistentPlayerName,
  getPersistentPlayerNameSync,
  setPersistentPlayerName
} from '../utils/storageUtils';
import TopActions from '../components/TopActions';
import { reportLobbyOpen } from '../services/analytics';
import { ArrowLeftIcon, PlusIcon, KeyIcon, BotIcon, ChevronRightIcon } from '../components/Icons';
import './Lobby.css';

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', desc: 'Calls numbers at random and sometimes finishes a line. Good for learning the flow.' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Plays the trained strategy about two calls in three, and a random number otherwise.' },
  { id: 'pro', label: 'Pro', desc: 'Trained on hundreds of thousands of games. Plays for the fastest five lines.' }
];

// An invite link joins on its own after a short pause, so the player sees what is happening and
// can step in. On a fresh page load the socket may still be connecting; it gets this long.
const AUTO_JOIN_DELAY_MS = 600;
const AUTO_JOIN_CONNECT_MS = 8000;

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, startBotGame, playerName } = useGame();
  const { connected } = useSocket();

  const [mode, setMode] = useState(null); // 'bot' | 'create' | 'join'
  const [name, setName] = useState(() => playerName || getPersistentPlayerNameSync() || '');
  const [difficulty, setDifficulty] = useState('pro');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  // Invite link with a saved name: { code, name, status: 'pending' | 'joining', at }.
  const [autoJoin, setAutoJoin] = useState(null);

  useEffect(() => { reportLobbyOpen(); }, []);

  useEffect(() => {
    if (!name) {
      getPersistentPlayerName().then(saved => {
        if (saved) setName(saved);
      });
    }
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('room') || params.get('join') || '').trim().toUpperCase();
    if (!code) return;
    setRoomId(code);
    setMode('join');
    // With a saved name and a connection the link lands in the room; otherwise the form waits,
    // with the code filled in and nothing focused.
    const saved = (playerName || getPersistentPlayerNameSync() || '').trim();
    const online = typeof navigator === 'undefined' || navigator.onLine;
    if (saved && online) setAutoJoin({ code, name: saved, status: 'pending', at: Date.now() });
  }, []);

  useEffect(() => {
    if (!autoJoin || autoJoin.status !== 'pending') return;
    const elapsed = Date.now() - autoJoin.at;
    if (!connected) {
      const giveUp = setTimeout(() => {
        setAutoJoin(null);
        setError('Could not reach the game server. Check your connection and try again.');
      }, Math.max(0, AUTO_JOIN_CONNECT_MS - elapsed));
      return () => clearTimeout(giveUp);
    }
    const start = setTimeout(() => {
      setAutoJoin(a => (a && a.status === 'pending' ? { ...a, status: 'joining' } : a));
      setError('');
      joinRoom(autoJoin.name, autoJoin.code, (res) => {
        if (res.success) return; // joinRoom moves to the room
        setAutoJoin(null);
        setError(res.error || 'Could not join the room.');
      });
    }, Math.max(0, AUTO_JOIN_DELAY_MS - elapsed));
    return () => clearTimeout(start);
  }, [autoJoin, connected, joinRoom]);

  // Step out of the automatic join: back to the form with the code kept, or drop the code entirely.
  function cancelAutoJoin({ clearCode = false } = {}) {
    setAutoJoin(null);
    setError('');
    if (clearCode) {
      setRoomId('');
      setMode(null);
      try { window.history.replaceState(null, '', window.location.pathname); } catch {}
    } else {
      setMode('join');
    }
  }

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); setError(''); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // The browser back button inside a form returns to the mode list instead of leaving the lobby.
  useEffect(() => {
    const handleLobbyBack = (e) => {
      if (autoJoin) {
        e.preventDefault();
        cancelAutoJoin({ clearCode: true });
      } else if (mode) {
        e.preventDefault();
        setMode(null);
        setError('');
      }
    };
    window.addEventListener('bingo:lobby-back', handleLobbyBack);
    return () => window.removeEventListener('bingo:lobby-back', handleLobbyBack);
  }, [mode, autoJoin]);

  function requireName() {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Enter a name first.');
      return null;
    }
    setPersistentPlayerName(cleanName);
    return cleanName;
  }

  function handleCreate(e) {
    e.preventDefault();
    const cleanName = requireName();
    if (!cleanName) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return setError('You are offline. Making a room needs a connection.');
    }
    setLoading(true);
    setError('');
    createRoom(cleanName, (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    const cleanName = requireName();
    if (!cleanName) return;
    if (!roomId.trim()) return setError('Enter the room code.');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return setError('You are offline. Joining a room needs a connection.');
    }
    setLoading(true);
    setError('');
    joinRoom(cleanName, roomId.trim().toUpperCase(), (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
    });
  }

  function handleBot(e) {
    e.preventDefault();
    const cleanName = requireName();
    if (!cleanName) return;
    setLoading(true);
    setError('');
    startBotGame(cleanName, difficulty, (res) => {
      setLoading(false);
      if (res && !res.success) setError(res.error || 'Could not start the match.');
    });
  }

  const levelIndex = Math.max(0, DIFFICULTIES.findIndex(d => d.id === difficulty));
  const level = DIFFICULTIES[levelIndex];

  const submitLabel = loading
    ? 'One moment'
    : mode === 'bot'
      ? `Start against ${DIFFICULTIES.find(d => d.id === difficulty)?.label.toLowerCase()} bot`
      : mode === 'create'
        ? 'Make room'
        : 'Join room';

  function handleBack() {
    if (autoJoin) return cancelAutoJoin({ clearCode: true });
    if (mode) return setMode(null);
    navigate('/');
  }

  return (
    <div className="lobby-page">
      <button className="btn btn-ghost back-btn" onClick={handleBack}>
        <ArrowLeftIcon size={16} />
        <span>{mode || autoJoin ? 'Back' : 'Home'}</span>
      </button>

      <TopActions />

      <div className="lobby-content">
        <div className="lobby-title">
          <div className="brand" aria-label="Bingo">
            {'BINGO'.split('').map((l) => (
              <span key={l} className="brand-tile">{l}</span>
            ))}
          </div>
          <h1>Lobby</h1>
          <p>Play with friends in a room, or against the bot on your own.</p>
        </div>

        {autoJoin && (
          <div className="side-panel auto-join-panel" role="status" aria-live="polite">
            <div className="auto-join-head">
              <span className="eyebrow">Invite link</span>
              <span className="tag tag-brass">{autoJoin.code}</span>
            </div>
            <p className="auto-join-text">
              <span className="auto-join-dot" aria-hidden="true" />
              <span>Joining room {autoJoin.code} as <strong>{autoJoin.name}</strong></span>
            </p>
            <div className="auto-join-actions">
              <button
                type="button"
                className="btn btn-sm btn-outline auto-join-rename"
                onClick={() => cancelAutoJoin()}
                disabled={autoJoin.status === 'joining'}
              >
                Use a different name
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost auto-join-cancel"
                onClick={() => cancelAutoJoin({ clearCode: true })}
                disabled={autoJoin.status === 'joining'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!mode && !autoJoin && (
          <div className="mode-select">
            <button className="mode-card mode-card-wide" onClick={() => setMode('bot')}>
              <span className="mode-icon"><BotIcon size={22} /></span>
              <span className="mode-text">
                <span className="mode-label">
                  Play against the bot
                  <span className="tag tag-ok">Works offline</span>
                </span>
                <span className="mode-desc">Three difficulty levels. No connection needed.</span>
              </span>
              <ChevronRightIcon size={18} className="mode-arrow" />
            </button>

            <div className="mode-grid">
              <button className="mode-card" onClick={() => setMode('create')}>
                <span className="mode-icon"><PlusIcon size={22} /></span>
                <span className="mode-label">Make a room</span>
                <span className="mode-desc">Get a code to share with up to 3 friends.</span>
              </button>

              <button className="mode-card" onClick={() => setMode('join')}>
                <span className="mode-icon"><KeyIcon size={20} /></span>
                <span className="mode-label">Join a room</span>
                <span className="mode-desc">Enter the 6-character code you were sent.</span>
              </button>
            </div>
          </div>
        )}

        {mode && !autoJoin && (
          <div className="lobby-form-wrap">
            <div className="form-mode-tabs" role="tablist">
              {[
                { id: 'bot', label: 'Bot', icon: <BotIcon size={16} /> },
                { id: 'create', label: 'Make room', icon: <PlusIcon size={16} /> },
                { id: 'join', label: 'Join room', icon: <KeyIcon size={16} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={mode === tab.id}
                  className={`mode-tab ${mode === tab.id ? 'active' : ''}`}
                  onClick={() => { setMode(tab.id); setError(''); }}
                  type="button"
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <form
              onSubmit={mode === 'bot' ? handleBot : mode === 'create' ? handleCreate : handleJoin}
              className="lobby-form"
            >
              <div className="form-group">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Shown to other players"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                />
              </div>

              {mode === 'bot' && (
                <div className="form-group difficulty-group">
                  <div className="difficulty-head">
                    <label htmlFor="difficulty">Difficulty</label>
                    <span className="tag tag-brass">{level.label}</span>
                  </div>
                  <div
                    className="difficulty-slider"
                    style={{ '--frac': levelIndex / Math.max(1, DIFFICULTIES.length - 1) }}
                  >
                    <input
                      id="difficulty"
                      type="range"
                      min="0"
                      max={DIFFICULTIES.length - 1}
                      step="1"
                      value={levelIndex}
                      onChange={e => setDifficulty(DIFFICULTIES[Number(e.target.value)]?.id || 'pro')}
                      aria-valuetext={level.label}
                    />
                    <div className="difficulty-stops" aria-hidden="true">
                      {DIFFICULTIES.map((d, i) => (
                        <span key={d.id} className={`difficulty-stop ${i <= levelIndex ? 'filled' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <div className="difficulty-labels">
                    {DIFFICULTIES.map((d, i) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`difficulty-label ${i === levelIndex ? 'active' : ''}`}
                        aria-pressed={i === levelIndex}
                        onClick={() => setDifficulty(d.id)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <p className="difficulty-desc">{level.desc}</p>
                </div>
              )}

              {mode === 'join' && (
                <div className="form-group">
                  <label htmlFor="roomid">Room code</label>
                  <input
                    id="roomid"
                    type="text"
                    placeholder="ABCD12"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.replace(/\s+/g, '').toUpperCase())}
                    maxLength={6}
                    className="room-code-input"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                  />
                </div>
              )}

              {isOffline && mode !== 'bot' && !error && (
                <div className="offline-notice" role="status">
                  You are offline. Rooms need a connection, but the bot works without one.
                </div>
              )}

              {error && (
                <div className="form-error" role="alert">
                  <div className="form-error-body">
                    <span>{error}</span>
                    {mode !== 'bot' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => { setMode('bot'); setError(''); }}
                      >
                        <BotIcon size={14} />
                        <span>Play against the bot instead</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary submit-action-btn" disabled={loading}>
                {submitLabel}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
