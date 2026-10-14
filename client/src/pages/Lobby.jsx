import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { 
  getPersistentPlayerName, 
  getPersistentPlayerNameSync, 
  setPersistentPlayerName 
} from '../utils/storageUtils';
import SoundToggle from '../components/SoundToggle';
import { ArrowLeftIcon, PlusIcon, KeyIcon, BotIcon, ZapIcon, SparklesIcon, ShieldIcon, ChevronRightIcon } from '../components/Icons';
import './Lobby.css';

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, startBotGame, playerName } = useGame();

  const [mode, setMode] = useState(null); // 'bot' | 'create' | 'join'
  const [name, setName] = useState(() => playerName || getPersistentPlayerNameSync() || '');
  const [difficulty, setDifficulty] = useState('pro'); // 'beginner' | 'intermediate' | 'pro'
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-fill from persistent storage if currently empty
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

  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

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

  // Intercept back button when inside a mode form (e.g. Bot difficulty, Create Room, Join Code)
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

  function handleCreate(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return setError('Please enter your name');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return setError('You are offline. Could not connect to the internet to create a multiplayer room.');
    }
    setPersistentPlayerName(cleanName);
    setLoading(true);
    setError('');
    createRoom(cleanName, (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return setError('Please enter your name');
    if (!roomId.trim()) return setError('Please enter a Room ID');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return setError('You are offline. Could not connect to the internet to join a multiplayer room.');
    }
    setPersistentPlayerName(cleanName);
    setLoading(true);
    setError('');
    joinRoom(cleanName, roomId.trim().toUpperCase(), (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
    });
  }

  function handleBot(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return setError('Please enter your name');
    setPersistentPlayerName(cleanName);
    setLoading(true);
    setError('');
    startBotGame(cleanName, difficulty, (res) => {
      setLoading(false);
      if (res && !res.success) setError(res.error || 'Failed to start bot match');
    });
  }

  return (
    <div className="lobby-page">
      <button className="btn btn-ghost back-btn" onClick={() => mode ? setMode(null) : navigate('/')}>
        <ArrowLeftIcon size={16} />
        <span>{mode ? 'Modes' : 'Home'}</span>
      </button>

      <SoundToggle className="sound-toggle-floating" />

      <div className="lobby-content">
        <div className="lobby-title">
          <div className="bingo-brand-logo" aria-label="BINGO">
            {'BINGO'.split('').map((l, i) => (
              <span key={i} className="bingo-brand-letter" style={{ animationDelay: `${i * 0.08}s` }}>{l}</span>
            ))}
          </div>
          <h2>Game Arena</h2>
          <p className="lobby-subtitle">Play multiplayer with friends or offline vs intelligent Bot</p>
        </div>

        {!mode && (
          <div className="mode-select">
            <button className="mode-card bot-card featured-bot-card" onClick={() => setMode('bot')}>
              <div className="mode-icon-circle icon-circle-amber">
                <BotIcon size={28} />
              </div>
              <div className="mode-card-text">
                <div className="mode-label-row">
                  <span className="mode-label">Play with Bot</span>
                  <span className="offline-pill">Offline Ready</span>
                </div>
                <div className="mode-desc">Practice solo vs AI in Beginner, Pro or Intermediate mode</div>
              </div>
              <div className="mode-card-arrow">
                <ChevronRightIcon size={20} />
              </div>
            </button>

            <div className="mode-multiplayer-grid">
              <button className="mode-card create-card" onClick={() => setMode('create')}>
                <div className="mode-icon-circle icon-circle-purple">
                  <PlusIcon size={26} />
                </div>
                <div className="mode-label">Create Room</div>
                <div className="mode-desc">Host a multiplayer room and invite your friends</div>
              </button>

              <button className="mode-card join-card" onClick={() => setMode('join')}>
                <div className="mode-icon-circle icon-circle-cyan">
                  <KeyIcon size={24} />
                </div>
                <div className="mode-label">Join Room</div>
                <div className="mode-desc">Enter a 6-digit Room ID to jump into a live game</div>
              </button>
            </div>
          </div>
        )}

        {mode && (
          <div className="lobby-form-wrap">
            <div className="form-mode-tabs">
              <button
                className={`mode-tab ${mode === 'bot' ? 'active' : ''}`}
                onClick={() => { setMode('bot'); setError(''); }}
                type="button"
              >
                <BotIcon size={16} />
                <span>Play vs Bot</span>
              </button>
              <button
                className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
                onClick={() => { setMode('create'); setError(''); }}
                type="button"
              >
                <PlusIcon size={16} />
                <span>Create Room</span>
              </button>
              <button
                className={`mode-tab ${mode === 'join' ? 'active' : ''}`}
                onClick={() => { setMode('join'); setError(''); }}
                type="button"
              >
                <KeyIcon size={16} />
                <span>Join Code</span>
              </button>
            </div>

            <form
              onSubmit={
                mode === 'bot'
                  ? handleBot
                  : mode === 'create'
                  ? handleCreate
                  : handleJoin
              }
              className="lobby-form"
            >
              <div className="form-group">
                <label htmlFor="name">Your Display Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              {/* Bot Difficulty Selector */}
              {mode === 'bot' && (
                <div className="form-group difficulty-selector-group">
                  <label className="difficulty-label-heading">Select AI Difficulty Level</label>
                  <div className="difficulty-options-grid">
                    <button
                      type="button"
                      className={`diff-option-card ${difficulty === 'beginner' ? 'selected' : ''}`}
                      onClick={() => setDifficulty('beginner')}
                    >
                      <div className="diff-header-line">
                        <span className="diff-bullet diff-bullet-green" />
                        <span className="diff-title">Beginner</span>
                      </div>
                      <p className="diff-desc">Casual &amp; friendly. Great for learning and relaxing.</p>
                    </button>

                    <button
                      type="button"
                      className={`diff-option-card ${difficulty === 'intermediate' ? 'selected' : ''}`}
                      onClick={() => setDifficulty('intermediate')}
                    >
                      <div className="diff-header-line">
                        <span className="diff-bullet diff-bullet-cyan" />
                        <span className="diff-title">Intermediate</span>
                      </div>
                      <p className="diff-desc">Strategic line builder. Takes opportunities and finishes lines.</p>
                    </button>

                    <button
                      type="button"
                      className={`diff-option-card ${difficulty === 'pro' ? 'selected' : ''}`}
                      onClick={() => setDifficulty('pro')}
                    >
                      <div className="diff-header-line">
                        <span className="diff-bullet diff-bullet-amber" />
                        <span className="diff-title">Pro Master</span>
                        <span className="diff-pro-badge">Optimized</span>
                      </div>
                      <p className="diff-desc">Synergy board grid, center opening pivot &amp; multi-line traps.</p>
                    </button>
                  </div>
                </div>
              )}

              {mode === 'join' && (
                <div className="form-group">
                  <label htmlFor="roomid">Room Code (6 Characters)</label>
                  <input
                    id="roomid"
                    type="text"
                    placeholder="e.g. ABCD12"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.replace(/\s+/g, '').toUpperCase())}
                    maxLength={6}
                    className="room-code-input"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              )}

              {isOffline && mode !== 'bot' && !error && (
                <div className="offline-notice-banner">
                  <span className="notice-icon">📶</span>
                  <span>You appear to be offline. Multiplayer needs internet, but you can play with Bot offline anytime!</span>
                </div>
              )}

              {error && (
                <div className="form-error offline-error-box">
                  <div className="error-text-row">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                  {mode !== 'bot' && (
                    <button
                      type="button"
                      className="btn-switch-bot"
                      onClick={() => { setMode('bot'); setError(''); }}
                    >
                      <BotIcon size={14} />
                      <span>Play with Bot Offline Instead</span>
                    </button>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary submit-action-btn" disabled={loading}>
                {loading
                  ? 'Preparing...'
                  : mode === 'bot'
                  ? `Start Match vs ${difficulty === 'pro' ? 'Pro' : difficulty === 'intermediate' ? 'Intermediate' : 'Beginner'} Bot`
                  : mode === 'create'
                  ? 'Create Room & Setup'
                  : 'Enter Room'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
