import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { buildPlayerColorMap } from '../utils/playerColors';
import SoundToggle from '../components/SoundToggle';
import ReturningPanel from '../components/ReturningPanel';
import {
  CopyIcon, ShareIcon, CrownIcon, TrophyIcon, CheckIcon, LogOutIcon,
  TriangleDownIcon, TriangleUpIcon, BotIcon, WifiOffIcon
} from '../components/Icons';
import { triggerShare, copyToClipboard } from '../utils/shareUtils';
import { getLayoutZoom } from '../utils/phoneLayout';
import { playSfx } from '../utils/sfx';
import './GamePage.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const LINE_EXTEND = 20; // px the strike line runs past the first and last cell centre

function lineEndpoints(boardEl, lineKey) {
  const cells = boardEl.querySelectorAll('.game-cell');
  if (cells.length !== 25) return null;
  const gridRect = boardEl.getBoundingClientRect();
  const z = getLayoutZoom(); // rects are unzoomed; the SVG lives in the zoomed layout
  const center = (r, c) => {
    const rect = cells[r * 5 + c].getBoundingClientRect();
    return { x: (rect.left - gridRect.left + rect.width / 2) / z, y: (rect.top - gridRect.top + rect.height / 2) / z };
  };

  if (lineKey.startsWith('row-')) {
    const r = Number(lineKey.slice(4));
    const s = center(r, 0), e = center(r, 4);
    return { x1: s.x - LINE_EXTEND, y1: s.y, x2: e.x + LINE_EXTEND, y2: e.y };
  }
  if (lineKey.startsWith('col-')) {
    const c = Number(lineKey.slice(4));
    const s = center(0, c), e = center(4, c);
    return { x1: s.x, y1: s.y - LINE_EXTEND, x2: e.x, y2: e.y + LINE_EXTEND };
  }
  const d = LINE_EXTEND * Math.SQRT1_2;
  if (lineKey === 'diag-main') {
    const s = center(0, 0), e = center(4, 4);
    return { x1: s.x - d, y1: s.y - d, x2: e.x + d, y2: e.y + d };
  }
  if (lineKey === 'diag-anti') {
    const s = center(0, 4), e = center(4, 0);
    return { x1: s.x + d, y1: s.y - d, x2: e.x - d, y2: e.y + d };
  }
  return null;
}

function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {}
}

export default function GamePage() {
  const navigate = useNavigate();
  const { connected } = useSocket() || {};
  const {
    roomData, myPlayer, playerId, isMyTurn, sessionPending,
    callNumber, leaveRoom, showNotif, setShareModalData
  } = useGame();

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [callError, setCallError] = useState('');
  // A call is sent once; the button waits for the answer so a second tap cannot follow it.
  const [callPending, setCallPending] = useState(false);
  // Ticks once a second while an away player's turn clock is running.
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [lineCoords, setLineCoords] = useState({});
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const boardRef = useRef(null);
  const prevLineCount = useRef(0);
  const prevMyTurn = useRef(false);
  const prevCalledCount = useRef(null);
  const MAX_HISTORY_ROWS = 3;

  useEffect(() => { if (!roomData && !sessionPending) navigate('/lobby'); }, [roomData, sessionPending, navigate]);

  const turnIndex = roomData?.currentTurnIndex;
  const calledCount = roomData?.calledNumbers?.length;
  const gameIndex = roomData?.currentGameIndex;

  // Any change of turn or a new call invalidates a pending selection.
  useEffect(() => {
    setSelectedNumber(null);
    setCallError('');
    setCallPending(false);
  }, [turnIndex, isMyTurn, calledCount, gameIndex]);

  const turnDeadline = roomData?.turnDeadline || null;
  useEffect(() => {
    if (!turnDeadline) return;
    setClockNow(Date.now());
    const t = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [turnDeadline]);

  const myLinesList = useMemo(() => {
    const lines = myPlayer?.bingoLines;
    if (!lines) return [];
    return Array.isArray(lines) ? lines : Array.from(lines);
  }, [myPlayer?.bingoLines]);
  const myLinesKey = myLinesList.slice().sort().join(',');

  // Strike lines are measured from the rendered cells so they follow any board size.
  useEffect(() => {
    const el = boardRef.current;
    if (!el || myLinesList.length === 0) {
      setLineCoords({});
      return;
    }
    const update = () => {
      const rect = el.getBoundingClientRect();
      const z = getLayoutZoom();
      setSvgSize({ w: rect.width / z, h: rect.height / z });
      const coords = {};
      for (const key of myLinesList) {
        const c = lineEndpoints(el, key);
        if (c) coords[key] = c;
      }
      setLineCoords(coords);
    };
    update();
    const raf = requestAnimationFrame(update);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [myLinesKey, myPlayer?.board]); // eslint-disable-line react-hooks/exhaustive-deps

  // Short vibration on phones when it becomes your turn and when you complete a line.
  useEffect(() => {
    if (isMyTurn && !prevMyTurn.current && roomData?.status === 'playing') { vibrate(30); playSfx('turn'); }
    prevMyTurn.current = Boolean(isMyTurn);
  }, [isMyTurn, roomData?.status]);

  useEffect(() => {
    if (myLinesList.length > prevLineCount.current && prevLineCount.current > 0) { vibrate([40, 60, 40]); playSfx('line'); }
    prevLineCount.current = myLinesList.length;
  }, [myLinesList.length]);

  // Stamp or call sound when a number is called.
  useEffect(() => {
    const called = roomData?.calledNumbers || [];
    const count = called.length;
    if (prevCalledCount.current === null || count <= prevCalledCount.current) {
      prevCalledCount.current = count;
      return;
    }
    prevCalledCount.current = count;
    const n = called[count - 1];
    const onMyCard = (myPlayer?.board || []).flat().includes(n);
    playSfx(onMyCard ? 'stamp' : 'call');
  }, [roomData?.calledNumbers?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the screen awake while a round is in progress so a phone does not sleep mid-game.
  const roomStatus = roomData?.status;
  useEffect(() => {
    if (roomStatus !== 'playing') return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel = null;
    let cancelled = false;
    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { lock.release().catch(() => {}); return; }
        sentinel = lock;
      } catch {}
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };
    request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel) { sentinel.release().catch(() => {}); sentinel = null; }
    };
  }, [roomStatus]);

  // Nudge a backgrounded tab via the title when it becomes your turn.
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const restore = () => { document.title = originalTitle.current; };
    if (!isMyTurn) return;
    if (document.hidden) document.title = 'Your turn - Bingo';
    const onVisibility = () => {
      if (document.visibilityState === 'visible') restore();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      restore();
    };
  }, [isMyTurn]);

  const players = roomData?.players || [];
  const playerColorMap = useMemo(() => buildPlayerColorMap(players), [players]);
  const calledHistory = roomData?.calledHistory || [];
  const callerByNumber = useMemo(() => {
    const map = {};
    calledHistory.forEach(h => { map[h.number] = h.calledById; });
    return map;
  }, [calledHistory]);

  if (!roomData) return sessionPending ? <ReturningPanel /> : null;
  if (!myPlayer) return null;

  const isBot = Boolean(roomData.isBot);
  const isPlaying = roomData.status === 'playing';
  const calledNumbers = roomData.calledNumbers || [];
  const currentTurnId = roomData.turnOrder?.[roomData.currentTurnIndex];
  const currentTurnPlayer = players.find(p => p.id === currentTurnId);
  const myBoard = myPlayer.board || [];
  const myMarked = new Set(myPlayer.markedCells || []);
  const myBingoCount = myLinesList.length;
  const lastCalled = calledNumbers.length ? calledNumbers[calledNumbers.length - 1] : null;
  const lastCaller = lastCalled ? players.find(p => p.id === callerByNumber[lastCalled]) : null;
  const turnColor = playerColorMap[currentTurnId];

  function handleCellClick(val) {
    if (!isMyTurn || !isPlaying) return;
    if (calledNumbers.includes(val) || myMarked.has(val)) return;
    setCallError('');
    if (selectedNumber !== val) playSfx('select');
    setSelectedNumber(prev => (prev === val ? null : val));
  }

  function handleCallConfirm() {
    if (!isMyTurn || !isPlaying || !selectedNumber || callPending) return;
    if (calledNumbers.includes(selectedNumber) || myMarked.has(selectedNumber)) {
      setCallError('That number has already been called.');
      setSelectedNumber(null);
      return;
    }
    setCallError('');
    setCallPending(true);
    callNumber(selectedNumber, res => {
      setCallPending(false);
      if (!res.success) setCallError(res.error || 'Could not call that number.');
      else setSelectedNumber(null);
    });
  }

  const handleShare = () => triggerShare({ roomId: roomData.id, showNotif, onFallbackModal: setShareModalData });
  const handleCopyId = async () => {
    try {
      await copyToClipboard(roomData.id || '');
      showNotif('Room code copied.', 'success');
    } catch {
      showNotif(`Room code: ${roomData.id}`, 'info');
    }
  };

  const turnPlayerDisconnected = currentTurnPlayer?.connected === false;
  const skipInSeconds = turnPlayerDisconnected && turnDeadline ? Math.max(0, Math.ceil((turnDeadline - clockNow) / 1000)) : null;
  const turnLabel = isMyTurn
    ? 'Your turn'
    : isBot
      ? 'Bot is choosing'
      : turnPlayerDisconnected
        ? `${currentTurnPlayer?.name || 'Someone'} is away`
        : `${currentTurnPlayer?.name || 'Someone'}'s turn`;

  const historyList = roomData.gameHistory || [];
  const shouldTruncate = historyList.length > MAX_HISTORY_ROWS;
  const visibleHistory = shouldTruncate && !historyExpanded ? historyList.slice(0, MAX_HISTORY_ROWS) : historyList;
  const standings = [
    ...players.map(p => ({ id: p.id, name: p.name, wins: p.wins || 0, active: true })),
    ...Object.values(roomData.leftPlayers || {}).map((p, idx) => ({ id: `left-${idx}`, name: p.name, wins: p.wins || 0, active: false }))
  ].sort((a, b) => b.wins - a.wins);

  return (
    <div className="game-page">
      <header className="game-topbar">
        <div className="topbar-left">
          {isBot ? (
            <div className="room-chip">
              <BotIcon size={16} />
              <span className="room-chip-text">Bot</span>
              <span className="tag">{roomData.difficulty || 'pro'}</span>
            </div>
          ) : (
            <div className="room-chip">
              <span className="eyebrow">Room</span>
              <span className="room-code">{roomData.id}</span>
              <button className="icon-btn sm plain" onClick={handleCopyId} title="Copy room code" aria-label="Copy room code" type="button">
                <CopyIcon size={15} />
              </button>
              <button className="icon-btn sm plain" onClick={handleShare} title="Share room" aria-label="Share room" type="button">
                <ShareIcon size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="topbar-center">
          <span className="tag round-tag">Round {roomData.currentGameIndex}</span>
          <div
            className={`turn-chip ${isMyTurn ? 'my-turn' : ''}`}
            style={!isMyTurn && !isBot && turnColor ? { borderColor: turnColor.border, color: turnColor.text } : undefined}
            aria-live="polite"
          >
            {isMyTurn && <span className="turn-dot" aria-hidden="true" />}
            {turnLabel}
          </div>
        </div>

        <div className="topbar-right">
          <SoundToggle />
          <button className="icon-btn leave-btn" onClick={leaveRoom} type="button" title="Leave room" aria-label="Leave room">
            <LogOutIcon size={18} />
          </button>
        </div>
      </header>

      {!isBot && connected === false && (
        <div className="connection-banner" role="status">
          <WifiOffIcon size={16} />
          <span>Connection lost. Trying to reconnect.</span>
        </div>
      )}

      <div className="game-main">
        <section className="game-board-section" aria-label="Your card">
          <div className="board-owner">
            <span>Your card</span>
            <strong style={{ color: playerColorMap[playerId]?.text }}>{myPlayer.name}</strong>
          </div>

          <div className="bingo-tracker" aria-label={`${myBingoCount} of 5 lines`}>
            {BINGO_LETTERS.map((letter, i) => (
              <span key={letter} className={`bingo-letter ${i < myBingoCount ? 'lit' : ''}`}>{letter}</span>
            ))}
          </div>

          <div className="board-wrap">
            <div className={`game-board ${!isMyTurn ? 'waiting' : ''}`} ref={boardRef} role="grid">
              {myBoard.map((row, r) =>
                row.map((val, c) => {
                  const isMarked = myMarked.has(val);
                  const isCalled = calledNumbers.includes(val);
                  const canPick = isMyTurn && isPlaying && !isCalled && !isMarked;
                  const isSelected = canPick && selectedNumber === val;
                  const caller = isMarked ? playerColorMap[callerByNumber[val]] : null;
                  const label = isMarked
                    ? `${val}, called by ${players.find(p => p.id === callerByNumber[val])?.name || 'someone'}`
                    : `${val}`;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={['game-cell', isMarked && 'marked', isSelected && 'selected'].filter(Boolean).join(' ')}
                      style={caller ? { '--caller': caller.solid, '--caller-bg': caller.bg } : undefined}
                      disabled={!canPick}
                      aria-pressed={isSelected}
                      aria-label={label}
                      onClick={() => handleCellClick(val)}
                    >
                      {val}
                      {isMarked && <CheckIcon size={10} className="cell-mark" />}
                    </button>
                  );
                })
              )}
            </div>

            {Object.keys(lineCoords).length > 0 && (
              <svg className="board-lines" width={svgSize.w} height={svgSize.h} aria-hidden="true">
                {Object.entries(lineCoords).map(([key, { x1, y1, x2, y2 }]) => (
                  <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="4" strokeLinecap="round" />
                ))}
              </svg>
            )}
          </div>

          {isPlaying && (
            <div className="call-bar">
              {isMyTurn ? (
                selectedNumber ? (
                  <>
                    <button className="btn btn-primary" onClick={handleCallConfirm} disabled={callPending} type="button">
                      <CheckIcon size={16} />
                      <span>{callPending ? 'Calling' : `Call ${selectedNumber}`}</span>
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setSelectedNumber(null); setCallError(''); }} type="button">
                      Cancel
                    </button>
                  </>
                ) : (
                  <span className="call-hint">Tap a number on your card to call it.</span>
                )
              ) : (
                <span className="call-hint">
                  {isBot ? 'The bot is choosing a number.' : turnPlayerDisconnected ? (
                    <><strong style={{ color: turnColor?.text }}>{currentTurnPlayer?.name}</strong> is away.{skipInSeconds !== null ? ` Their turn passes in ${skipInSeconds} s.` : ''}</>
                  ) : (
                    <>Waiting for <strong style={{ color: turnColor?.text }}>{currentTurnPlayer?.name}</strong> to call.</>
                  )}
                </span>
              )}
              {callError && <div className="call-error" role="alert">{callError}</div>}
            </div>
          )}
        </section>

        <aside className="game-side">
          <div className="side-panel">
            <h3 className="eyebrow">Last call</h3>
            {lastCalled ? (
              <div className="last-call">
                <span className="last-call-num" style={{ '--ball': playerColorMap[callerByNumber[lastCalled]]?.solid }}>{lastCalled}</span>
                <div className="last-call-text">
                  <strong>{lastCalled}</strong>
                  {lastCaller && <span style={{ color: playerColorMap[lastCaller.id]?.text }}>by {lastCaller.name}</span>}
                </div>
              </div>
            ) : (
              <p className="side-empty">Nothing called yet.</p>
            )}
          </div>

          <div className="side-panel">
            <h3 className="eyebrow">{isBot ? 'Opponent' : 'Other players'}</h3>
            <div className="player-list">
              {players.filter(p => p.id !== playerId).map(p => {
                const pLines = new Set(p.bingoLines || []).size;
                const isTurn = p.id === currentTurnId;
                const color = playerColorMap[p.id];
                return (
                  <div key={p.id} className={`player-card ${isTurn ? 'is-turn' : ''}`} style={isTurn ? { borderColor: color?.border } : undefined}>
                    <div className="player-card-head">
                      <span className="player-name" style={{ color: color?.text }}>
                        {isBot && <BotIcon size={14} />}
                        {p.name}
                        {!isBot && p.id === roomData.creatorId && <CrownIcon size={12} className="host-icon" />}
                      </span>
                      {p.connected === false
                        ? <span className="tag tag-bad">Away</span>
                        : isTurn && <span className="tag">Turn</span>}
                    </div>
                    <div className="player-card-foot">
                      <span className="mini-letters" aria-label={`${pLines} of 5 lines`}>
                        {BINGO_LETTERS.map((l, i) => (
                          <span key={l} className={i < pLines ? 'lit' : ''} style={i < pLines ? { background: color?.solid } : undefined}>{l}</span>
                        ))}
                      </span>
                      <span className="player-wins"><TrophyIcon size={12} /> {p.wins || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {historyList.length > 0 && (
            <div className="side-panel">
              <h3 className="eyebrow">Rounds</h3>
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

              <h3 className="eyebrow standings-head">Wins</h3>
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
