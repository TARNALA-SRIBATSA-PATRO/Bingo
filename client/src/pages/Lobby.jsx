import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SoundToggle from '../components/SoundToggle';
import { ArrowLeftIcon, PlusIcon, KeyIcon } from '../components/Icons';
import './Lobby.css';

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGame();

  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || params.get('join');
    if (code) {
      setRoomId(code.trim().toUpperCase());
      setMode('join');
    }
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name');
    setLoading(true);
    setError('');
    createRoom(name.trim(), (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name');
    if (!roomId.trim()) return setError('Please enter a Room ID');
    setLoading(true);
    setError('');
    joinRoom(name.trim(), roomId.trim().toUpperCase(), (res) => {
      setLoading(false);
      if (!res.success) setError(res.error);
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
          <h2>Multiplayer Arena</h2>
          <p className="lobby-subtitle">Play with friends anywhere across devices</p>
        </div>

        {!mode && (
          <div className="mode-select">
            <button className="mode-card create-card" onClick={() => setMode('create')}>
              <div className="mode-icon-circle icon-circle-purple">
                <PlusIcon size={26} />
              </div>
              <div className="mode-label">Create Room</div>
              <div className="mode-desc">Host a new game room and invite your friends</div>
            </button>

            <button className="mode-card join-card" onClick={() => setMode('join')}>
              <div className="mode-icon-circle icon-circle-cyan">
                <KeyIcon size={24} />
              </div>
              <div className="mode-label">Join Room</div>
              <div className="mode-desc">Enter a 6-digit Room ID to jump into a game</div>
            </button>
          </div>
        )}

        {mode && (
          <div className="lobby-form-wrap">
            <div className="form-mode-tabs">
              <button
                className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
                onClick={() => { setMode('create'); setError(''); }}
                type="button"
              >
                <PlusIcon size={16} />
                <span>Create New Room</span>
              </button>
              <button
                className={`mode-tab ${mode === 'join' ? 'active' : ''}`}
                onClick={() => { setMode('join'); setError(''); }}
                type="button"
              >
                <KeyIcon size={16} />
                <span>Join with Code</span>
              </button>
            </div>

            <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="lobby-form">
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

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary submit-action-btn" disabled={loading}>
                {loading ? 'Connecting...' : (mode === 'create' ? 'Create Room & Setup' : 'Enter Room')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
