import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  getPersistentPlayerName,
  getPersistentPlayerNameSync,
  setPersistentPlayerName
} from '../utils/storageUtils';
import SoundToggle from '../components/SoundToggle';
import { ArrowLeftIcon, PlusIcon, KeyIcon, BotIcon, ChevronRightIcon } from '../components/Icons';
import './Lobby.css';

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', desc: 'Calls numbers at random. Good for learning the flow.' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Works on one line at a time and finishes it when it can.' },
  { id: 'pro', label: 'Pro', desc: 'Opens from the centre and builds several lines at once.' }
];

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, startBotGame, playerName } = useGame();

  const [mode, setMode] = useState(null); // 'bot' | 'create' | 'join'
  const [name, setName] = useState(() => playerName || getPersistentPlayerNameSync() || '');
  const [difficulty, setDifficulty] = useState('pro');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    if (!name) {
      getPersistentPlayerName().then(saved => {
        if (saved) setName(saved);
      });
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || params.get('join');
    if (code) {
      setRoomId(code.trim().toUpperCase());
      setMode('join');
    }
  }, []);

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
      if (mode) {
        e.preventDefault();
        setMode(null);
        setError('');
      }
    };
    window.addEventListener('bingo:lobby-back', handleLobbyBack);
    return () => window.removeEventListener('bingo:lobby-back', handleLobbyBack);
  }, [mode]);

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

  const submitLabel = loading
    ? 'One moment'
    : mode === 'bot'
      ? `Start against ${DIFFICULTIES.find(d => d.id === difficulty)?.label.toLowerCase()} bot`
      : mode === 'create'
        ? 'Make room'
        : 'Join room';

  return (
    <div className="lobby-page">
      <button className="btn btn-ghost back-btn" onClick={() => mode ? setMode(null) : navigate('/')}>
        <ArrowLeftIcon size={16} />
        <span>{mode ? 'Back' : 'Home'}</span>
      </button>

      <SoundToggle className="sound-toggle-floating" />

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

        {!mode && (
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

        {mode && (
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
                  autoFocus
                />
              </div>

              {mode === 'bot' && (
                <fieldset className="form-group difficulty-group">
                  <legend>Difficulty</legend>
                  {DIFFICULTIES.map(d => (
                    <label key={d.id} className={`diff-option ${difficulty === d.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={d.id}
                        checked={difficulty === d.id}
                        onChange={() => setDifficulty(d.id)}
                      />
                      <span className="diff-title">{d.label}</span>
                      <span className="diff-desc">{d.desc}</span>
                    </label>
                  ))}
                </fieldset>
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
