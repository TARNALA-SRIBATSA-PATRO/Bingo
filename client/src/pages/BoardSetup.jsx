import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SoundToggle from '../components/SoundToggle';
import StartGameModal from '../components/StartGameModal';
import {
  CopyIcon, ShareIcon, CheckIcon, ShuffleIcon, TrashIcon, PencilIcon, CrownIcon, ClockIcon,
  PlayIcon, TrophyIcon, LogOutIcon, TriangleDownIcon, TriangleUpIcon, BotIcon
} from '../components/Icons';
import { triggerShare, copyToClipboard } from '../utils/shareUtils';
import './BoardSetup.css';

const EMPTY_BOARD = () => Array.from({ length: 5 }, () => Array(5).fill(null));

function generateRandomBoard() {
  const nums = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5));
}

function isFullBoard(b) {
  return Array.isArray(b) && b.length === 5 && b.flat().filter(Boolean).length === 25;
}

export default function BoardSetup() {
  const navigate = useNavigate();
  const {
    roomData, myPlayer, playerName, isCreator, playerId,
    submitBoard, startGame, leaveRoom, showNotif, setShareModalData
  } = useGame();

  const [board, setBoard] = useState(EMPTY_BOARD);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualTarget, setManualTarget] = useState(null); // { r, c }
  const [inputError, setInputError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startError, setStartError] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const promptedRef = useRef(false);
  const MAX_HISTORY_ROWS = 3;

  useEffect(() => {
    if (!roomData) navigate('/lobby');
  }, [roomData, navigate]);

  const isBot = Boolean(roomData?.isBot);
  const gameIndex = roomData?.currentGameIndex ?? 0;
  const stableName = myPlayer?.name || playerName || '';
  const storageKey = roomData?.id ? `bingo_setup_${roomData.id}_${stableName}` : null;
  const legacyKey = roomData?.id && playerId ? `bingo_setup_${roomData.id}_${playerId}` : null;

  const totalFilled = board.flat().filter(Boolean).length;
  const isBoardFull = totalFilled === 25;
  // Only a multiplayer card locks after submit; against the bot the card stays editable.
  const isLocked = !isBot && (submitted || Boolean(myPlayer?.ready)) && isBoardFull;

  // Restore a card for this round from the server or local storage, otherwise start blank.
  useEffect(() => {
    if (!roomData?.id) return;

    if (isBot) {
      setSubmitted(false);
      if (isFullBoard(myPlayer?.board)) {
        setBoard(myPlayer.board);
        return;
      }
    }

    if (!isBot && myPlayer?.ready && isFullBoard(myPlayer.board)) {
      setBoard(myPlayer.board);
      setSubmitted(true);
      return;
    }

    try {
      const saved = (storageKey && localStorage.getItem(storageKey)) || (legacyKey && localStorage.getItem(legacyKey));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gameIndex === gameIndex) {
          if (Array.isArray(parsed.board) && parsed.board.length === 5) setBoard(parsed.board);
          if (!isBot && (parsed.submitted || myPlayer?.ready) && isFullBoard(parsed.board)) setSubmitted(true);
          return;
        }
      }
    } catch {}

    setBoard(EMPTY_BOARD());
    setManualMode(false);
    setManualInput('');
    setManualTarget(null);
    setInputError('');
    setSubmitted(false);
    setStartError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameIndex, roomData?.id, stableName, myPlayer?.ready, myPlayer?.board, isBot]);

  // Keep the in-progress card in local storage so a refresh does not lose it.
  useEffect(() => {
    if (!storageKey) return;
    if (!isBot && myPlayer?.ready && totalFilled === 0) return;
    const shouldSaveSubmitted = !isBot && (submitted || Boolean(myPlayer?.ready)) && totalFilled === 25;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ gameIndex, board, submitted: shouldSaveSubmitted }));
    } catch {}
  }, [storageKey, board, submitted, gameIndex, myPlayer?.ready, isBot, totalFilled]);

  function handleCellClick(r, c) {
    if (isLocked) return;
    if (manualMode) {
      setManualTarget({ r, c });
      setInputError('');
      return;
    }
    const next = board.map(row => [...row]);
    if (board[r][c] !== null) {
      next[r][c] = null;
      setBoard(next);
      return;
    }
    const used = new Set(board.flat().filter(Boolean));
    let n = 1;
    while (n <= 25 && used.has(n)) n++;
    if (n > 25) return;
    next[r][c] = n;
    setBoard(next);
  }

  function handleManualInput() {
    if (!manualTarget) { setInputError('Pick a cell first.'); return; }
    const num = parseInt(manualInput, 10);
    if (Number.isNaN(num) || num < 1 || num > 25) { setInputError('Enter a number from 1 to 25.'); return; }
    const current = board[manualTarget.r][manualTarget.c];
    if (board.flat().includes(num) && current !== num) { setInputError(`${num} is already on your card.`); return; }
    const next = board.map(row => [...row]);
    next[manualTarget.r][manualTarget.c] = num;
    setBoard(next);
    setManualInput('');
    setManualTarget(null);
    setInputError('');
  }

  function handleShuffle() {
    setBoard(generateRandomBoard());
    setManualTarget(null);
    setManualInput('');
  }

  function handleClearBoard() {
    setBoard(EMPTY_BOARD());
    setManualTarget(null);
    setManualInput('');
  }

  function handleSubmit() {
    const flat = board.flat();
    if (flat.some(n => n === null || n === undefined)) {
      showNotif('Fill all 25 cells first.', 'warning');
      return;
    }
    if (new Set(flat).size !== 25) {
      showNotif('Each number can only appear once.', 'error');
      return;
    }
    submitBoard(board, (res) => {
      if (!res.success) { showNotif(res.error, 'error'); return; }
      if (!isBot) setSubmitted(true);
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify({ gameIndex, board, submitted: !isBot })); } catch {}
      }
    });
  }

  function handleStartGame() {
    setStartError('');
    startGame((res) => { if (!res.success) setStartError(res.error); });
  }

  const handleShare = () => triggerShare({ roomId: roomData?.id, showNotif, onFallbackModal: setShareModalData });
  const handleCopyId = async () => {
    try {
      await copyToClipboard(roomData?.id || '');
      showNotif('Room code copied.', 'success');
    } catch {
      showNotif(`Room code: ${roomData?.id}`, 'info');
    }
  };

  const players = roomData?.players || [];
  const readyCount = players.filter(p => p.ready).length;
  const allReady = players.length >= 2 && readyCount === players.length;

  useEffect(() => {
    if (!isBot && isCreator && allReady) {
      if (!promptedRef.current) {
        promptedRef.current = true;
        setShowStartModal(true);
      }
    } else {
      promptedRef.current = false;
      setShowStartModal(false);
    }
  }, [isBot, isCreator, allReady, roomData?.currentGameIndex]);

  const historyList = roomData?.gameHistory || [];
  const shouldTruncate = historyList.length > MAX_HISTORY_ROWS;
  const visibleHistory = shouldTruncate && !historyExpanded ? historyList.slice(0, MAX_HISTORY_ROWS) : historyList;
  const standings = [
    ...players.map(p => ({ id: p.id, name: p.name, wins: p.wins || 0, active: true })),
    ...Object.values(roomData?.leftPlayers || {}).map((p, idx) => ({ id: `left-${idx}`, name: p.name, wins: p.wins || 0, active: false }))
  ].sort((a, b) => b.wins - a.wins);

  return (
    <div className="board-setup-page">
      {!isBot && showStartModal && (
        <StartGameModal
          onStart={() => { setShowStartModal(false); handleStartGame(); }}
          onNotNow={() => setShowStartModal(false)}
          playerCount={players.length}
          roundIndex={roomData?.currentGameIndex || 1}
        />
      )}

      <header className="setup-header">
        {isBot ? (
          <div className="room-chip">
            <BotIcon size={16} />
            <span className="room-chip-text">Bot</span>
            <span className="tag">{roomData?.difficulty || 'pro'}</span>
          </div>
        ) : (
          <div className="room-chip">
            <span className="eyebrow">Room</span>
            <span className="room-code">{roomData?.id}</span>
            <button className="icon-btn sm plain" title="Copy room code" aria-label="Copy room code" onClick={handleCopyId} type="button">
              <CopyIcon size={15} />
            </button>
            <button className="icon-btn sm plain" title="Share room" aria-label="Share room" onClick={handleShare} type="button">
              <ShareIcon size={15} />
            </button>
          </div>
        )}
        <span className="tag round-tag">Round {roomData?.currentGameIndex}</span>
        <div className="setup-header-actions">
          <SoundToggle />
          <button className="icon-btn leave-btn" onClick={leaveRoom} type="button" title="Leave room" aria-label="Leave room">
            <LogOutIcon size={18} />
          </button>
        </div>
      </header>

      <div className="setup-main">
        <section className="board-section" aria-label="Your card">
          <div className="setup-title">
            {isLocked ? (
              <span className="ready-badge"><CheckIcon size={16} /> Card submitted. Waiting for the others.</span>
            ) : (
              <>
                <h2>Arrange your card</h2>
                <span className="fill-count">{totalFilled} of 25</span>
              </>
            )}
          </div>

          <div className={`board-grid ${isLocked ? 'locked' : ''}`} role="grid">
            {board.map((row, r) =>
              row.map((val, c) => {
                const isTarget = manualTarget?.r === r && manualTarget?.c === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`board-cell ${val === null ? 'empty' : 'filled'} ${isTarget ? 'targeted' : ''}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={isLocked}
                    type="button"
                    aria-label={val === null ? `Row ${r + 1}, column ${c + 1}, empty` : `Row ${r + 1}, column ${c + 1}, ${val}`}
                  >
                    {val ?? ''}
                  </button>
                );
              })
            )}
          </div>

          {!isLocked && (
            <div className="board-controls">
              <p className="board-help">
                {manualMode
                  ? 'Tap a cell, then type the number for it.'
                  : 'Tap empty cells to fill them in order. Tap a filled cell to clear it.'}
              </p>
              <div className="controls-row">
                <button
                  className={`btn btn-sm ${manualMode ? 'btn-accent' : 'btn-outline'}`}
                  onClick={() => { setManualMode(!manualMode); setManualTarget(null); setInputError(''); }}
                  type="button"
                  aria-pressed={manualMode}
                >
                  <PencilIcon size={14} />
                  <span>Type numbers</span>
                </button>
                <button className="btn btn-sm btn-outline" onClick={handleShuffle} type="button">
                  <ShuffleIcon size={14} />
                  <span>Shuffle</span>
                </button>
                <button className="icon-btn sm clear-btn" onClick={handleClearBoard} type="button" title="Clear card" aria-label="Clear card">
                  <TrashIcon size={16} />
                </button>
              </div>

              {manualMode && (
                <div className="manual-input-row">
                  <span className="manual-hint">
                    {manualTarget ? `Row ${manualTarget.r + 1}, column ${manualTarget.c + 1}` : 'No cell picked'}
                  </span>
                  <div className="manual-input-group">
                    <input
                      type="number"
                      min={1}
                      max={25}
                      inputMode="numeric"
                      placeholder="1 to 25"
                      aria-label="Number for the picked cell"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualInput()}
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleManualInput} type="button">Place</button>
                  </div>
                  {inputError && <div className="input-error" role="alert">{inputError}</div>}
                </div>
              )}

              <button className="btn btn-primary submit-board-btn" onClick={handleSubmit} disabled={!isBoardFull} type="button">
                <CheckIcon size={18} />
                <span>{isBot ? 'Start match' : 'Submit card'}</span>
              </button>
            </div>
          )}
        </section>

        <aside className="players-sidebar">
          {isBot ? (
            <div className="bot-info">
              <div className="bot-info-head">
                <span className="mode-icon"><BotIcon size={20} /></span>
                <div>
                  <h3>Against the bot</h3>
                  <p>{roomData?.difficulty || 'pro'} difficulty</p>
                </div>
              </div>
              <p className="bot-info-tip">Fill all 25 cells, then start. The bot has its own card and takes turns with you.</p>
            </div>
          ) : (
            <>
              <h3 className="eyebrow">Players</h3>
              <div className="players-list">
                {players.map(p => (
                  <div key={p.id} className={`player-row ${p.id === playerId ? 'me' : ''}`}>
                    <span className="player-name">
                      {p.name}
                      {p.id === roomData?.creatorId && <CrownIcon size={13} className="host-icon" title="Host" />}
                      {p.id === playerId && <span className="you-note">(you)</span>}
                    </span>
                    <span className={`player-status ${p.ready ? 'ready' : ''}`}>
                      {p.ready ? <><CheckIcon size={13} /> Ready</> : <><ClockIcon size={13} /> Arranging</>}
                    </span>
                  </div>
                ))}
              </div>

              <p className="ready-summary">{readyCount} of {players.length} ready</p>

              {isCreator && (
                <div className="start-section">
                  <button
                    className="btn btn-primary"
                    onClick={handleStartGame}
                    disabled={!allReady}
                    title={!allReady ? 'Waiting for every card' : 'Start the round'}
                    type="button"
                  >
                    <PlayIcon size={18} />
                    <span>Start round</span>
                  </button>
                  {!allReady && (
                    <p className="start-hint">
                      {players.length < 2 ? 'At least 2 players are needed.' : 'Waiting for everyone to submit a card.'}
                    </p>
                  )}
                  {startError && <div className="form-error">{startError}</div>}
                </div>
              )}

              {!isCreator && allReady && (
                <p className="waiting-creator"><ClockIcon size={14} /> Waiting for the host to start.</p>
              )}
            </>
          )}

          {historyList.length > 0 && (
            <div className="history-mini">
              <h4 className="eyebrow">Rounds</h4>
              <ul className="round-list">
                {visibleHistory.map(g => (
                  <li key={g.gameIndex}>
                    <span className="round-num">Round {g.gameIndex}</span>
                    <span className="round-winner">
                      {(g.draw || g.winners.length > 1) ? <span className="tag tag-info">Draw</span> : <TrophyIcon size={12} />}
                      {' '}{g.winners.map(w => w.name).join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
              {shouldTruncate && (
                <button type="button" className="history-toggle-row" onClick={() => setHistoryExpanded(v => !v)} aria-expanded={historyExpanded}>
                  <span>{historyExpanded ? 'Show fewer' : `Show all ${historyList.length}`}</span>
                  {historyExpanded ? <TriangleUpIcon size={10} /> : <TriangleDownIcon size={10} />}
                </button>
              )}
              <h4 className="eyebrow standings-head">Wins</h4>
              <ul className="round-list">
                {standings.map(p => (
                  <li key={p.id} className={p.active ? '' : 'left'}>
                    <span>{p.name}{p.active ? '' : ' (left)'}</span>
                    <strong>{p.wins}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
