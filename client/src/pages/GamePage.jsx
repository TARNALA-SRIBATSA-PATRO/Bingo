import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { buildPlayerColorMap } from '../utils/playerColors';
import SoundToggle from '../components/SoundToggle';
import { CopyIcon, ShareIcon, CrownIcon, TrophyIcon, CrosshairIcon, CheckIcon, LeaveIcon, TriangleDownIcon, TriangleUpIcon, BotIcon, EyeIcon } from '../components/Icons';
import { triggerShare, copyToClipboard } from '../utils/shareUtils';
import './GamePage.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

function getLineCells(lineKey) {
 if (lineKey.startsWith('row-')) {
 const r = parseInt(lineKey.split('-')[1]);
 return Array.from({ length: 5 }, (_, c) => ({ r, c }));
 }
 if (lineKey.startsWith('col-')) {
 const c = parseInt(lineKey.split('-')[1]);
 return Array.from({ length: 5 }, (_, r) => ({ r, c }));
 }
 if (lineKey === 'diag-main') return [0,1,2,3,4].map(i => ({ r: i, c: i }));
 if (lineKey === 'diag-anti') return [0,1,2,3,4].map(i => ({ r: i, c: 4 - i }));
 return [];
}

/** Measure SVG line coordinates from actual rendered board cells */
function computeLineCoords(boardEl, lineKey) {
 const cells = boardEl.querySelectorAll('.game-cell');
 if (cells.length !== 25) return null;
 const gridRect = boardEl.getBoundingClientRect();

 const center = (r, c) => {
 const rect = cells[r * 5 + c].getBoundingClientRect();
 return {
 x: rect.left - gridRect.left + rect.width / 2,
 y: rect.top - gridRect.top + rect.height / 2,
 };
 };

 const EXTEND = 28; // px to extend the line beyond first/last cell center

 if (lineKey.startsWith('row-')) {
 const r = parseInt(lineKey.split('-')[1]);
 const s = center(r, 0); const e = center(r, 4);
 return { x1: s.x - EXTEND, y1: s.y, x2: e.x + EXTEND, y2: e.y };
 }
 if (lineKey.startsWith('col-')) {
 const c = parseInt(lineKey.split('-')[1]);
 const s = center(0, c); const e = center(4, c);
 return { x1: s.x, y1: s.y - EXTEND, x2: e.x, y2: e.y + EXTEND };
 }
 if (lineKey === 'diag-main') {
 const s = center(0, 0); const e = center(4, 4);
 const dx = EXTEND * Math.cos(Math.PI / 4);
 return { x1: s.x - dx, y1: s.y - dx, x2: e.x + dx, y2: e.y + dx };
 }
 if (lineKey === 'diag-anti') {
 const s = center(0, 4); const e = center(4, 0);
 const dx = EXTEND * Math.cos(Math.PI / 4);
 return { x1: s.x + dx, y1: s.y - dx, x2: e.x - dx, y2: e.y + dx };
 }
 return null;
}

export default function GamePage() {
 const navigate = useNavigate();
 const {
 roomData, myPlayer, playerId, isCreator, isMyTurn,
 callNumber, replayGame, leaveRoom, gameOver, showNotif, setShareModalData,
 } = useGame();

 const [selectedNumber, setSelectedNumber] = useState(null);
 const [callError, setCallError] = useState('');
 const [lastCalled, setLastCalled] = useState(null);
 const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
 const [lineCoords, setLineCoords] = useState({});
 const [historyExpanded, setHistoryExpanded] = useState(false);
 const boardRef = useRef(null);
 const MAX_HISTORY_ROWS = 3;

 useEffect(() => { if (!roomData) navigate('/lobby'); }, [roomData, navigate]);

 useEffect(() => {
 if (roomData?.calledNumbers?.length) {
 setLastCalled(roomData.calledNumbers[roomData.calledNumbers.length - 1]);
 }
 }, [roomData?.calledNumbers]);

 // Always clear selection whenever turn index changes, turn switches,
 // a new number is called, or game round updates.
 const turnIndex = roomData?.currentTurnIndex;
 const calledCount = roomData?.calledNumbers?.length;
 const gameIndex = roomData?.currentGameIndex;

 useEffect(() => {
 setSelectedNumber(null);
 setCallError('');
 }, [turnIndex, isMyTurn, calledCount, gameIndex]);

 // Recompute SVG line coords whenever lines change or board resizes
 const myLinesList = useMemo(() => {
   if (!myPlayer?.bingoLines) return [];
   if (Array.isArray(myPlayer.bingoLines)) return myPlayer.bingoLines;
   if (myPlayer.bingoLines instanceof Set || typeof myPlayer.bingoLines[Symbol.iterator] === 'function') {
     return Array.from(myPlayer.bingoLines);
   }
   return [];
 }, [myPlayer?.bingoLines]);

 const myLinesKey = useMemo(() => [...myLinesList].sort().join(','), [myLinesList]);

 useEffect(() => {
   if (!boardRef.current || myLinesList.length === 0) {
     setLineCoords({});
     return;
   }

   const updateCoords = () => {
     if (!boardRef.current) return;
     const el = boardRef.current;
     const rect = el.getBoundingClientRect();
     setSvgSize({ w: rect.width, h: rect.height });

     const coords = {};
     for (const lineKey of myLinesList) {
       const c = computeLineCoords(el, lineKey);
       if (c) coords[lineKey] = c;
     }
     setLineCoords(coords);
   };

   updateCoords();
   const raf = requestAnimationFrame(updateCoords);
   return () => cancelAnimationFrame(raf);
 }, [myLinesKey, myPlayer?.board, myLinesList]);

 // Recalculate on window resize
 useEffect(() => {
   const onResize = () => {
     if (!boardRef.current || myLinesList.length === 0) return;
     const el = boardRef.current;
     const rect = el.getBoundingClientRect();
     setSvgSize({ w: rect.width, h: rect.height });
     const coords = {};
     for (const lineKey of myLinesList) {
       const c = computeLineCoords(el, lineKey);
       if (c) coords[lineKey] = c;
     }
     setLineCoords(coords);
   };
   window.addEventListener('resize', onResize);
   return () => window.removeEventListener('resize', onResize);
 }, [myLinesKey, myLinesList]);

 if (!roomData || !myPlayer) return null;

 const isBot = Boolean(roomData?.isBot);
 const players = roomData.players || [];
 const calledNumbers = roomData.calledNumbers || [];
 const calledHistory = roomData.calledHistory || [];
 const currentTurnId = roomData.turnOrder?.[roomData.currentTurnIndex];
 const currentTurnPlayer = players.find(p => p.id === currentTurnId);
 const myBoard = myPlayer.board || [];
 const myMarked = new Set(myPlayer.markedCells || []);
 const myLines = new Set(myPlayer.bingoLines || []);
 const myBingoCount = myLines.size;

 // Build color maps
 const playerColorMap = useMemo(() => buildPlayerColorMap(players), [players]);

 // Map number  who called it
 const callerByNumber = useMemo(() => {
 const map = {};
 calledHistory.forEach(h => { map[h.number] = h.calledById; });
 return map;
 }, [calledHistory]);

 // Cells in completed lines (to suppress default border)
 const lineCellSet = new Set();
 for (const line of myLines) {
 for (const { r, c } of getLineCells(line)) lineCellSet.add(`${r}-${c}`);
 }

  /*  Event handlers  */
  function handleCellClick(val) {
    if (!isMyTurn || roomData?.status !== 'playing') {
      setSelectedNumber(null);
      return;
    }
    if (calledNumbers.includes(val) || myMarked.has(val)) return;
    setCallError('');
    setSelectedNumber(prev => (prev === val ? null : val));
  }

  function handleCallConfirm() {
    if (!isMyTurn || roomData?.status !== 'playing') {
      setSelectedNumber(null);
      setCallError('Not your turn!');
      return;
    }
    if (!selectedNumber) return;
    if (calledNumbers.includes(selectedNumber) || myMarked.has(selectedNumber)) {
      setCallError('Already called!');
      setSelectedNumber(null);
      return;
    }
    setCallError('');
    callNumber(selectedNumber, res => {
      if (!res.success) {
        setCallError(res.error || 'Failed to call number');
      } else {
        setSelectedNumber(null);
      }
    });
  }

 function handleReplay() {
 replayGame(res => { if (!res.success) showNotif(res.error, 'error'); });
 }

  const handleShare = () => {
    triggerShare({
      roomId: roomData?.id,
      showNotif,
      onFallbackModal: setShareModalData
    });
  };

  const handleCopyId = async () => {
    try {
      await copyToClipboard(roomData?.id || '');
      showNotif('Copied!', 'success');
    } catch {
      showNotif(`Room Code: ${roomData?.id}`, 'info');
    }
  };

 return (
 <div className="game-page">

 {/*  Top bar  */}
 <div className="game-topbar">
 <div className="topbar-left">
 {isBot ? (
 <div className="bot-match-chip">
 <div className="bot-chip-icon">
 <BotIcon size={16} />
 </div>
 <span className="bot-chip-name">vs BingoBot</span>
 <span className={`diff-chip-tag diff-${roomData.difficulty || 'pro'}`}>
 {(roomData.difficulty || 'pro').toUpperCase()}
 </span>
 </div>
 ) : (
 <div className="room-id-chip">
 <span className="chip-label">ROOM</span>
 <span className="chip-value">{roomData.id}</span>
 <button
 className="copy-mini-btn"
 onClick={handleCopyId}
 title="Copy Room ID"
 aria-label="Copy Room ID"
 type="button"
 >
 <CopyIcon size={14} />
 </button>
 <button
 className="copy-mini-btn"
 onClick={handleShare}
 title="Share Room"
 aria-label="Share Room"
 type="button"
 >
 <ShareIcon size={14} />
 </button>
 </div>
 )}
 </div>

 <div className="topbar-center">
 <div className="game-index-chip">Round #{roomData.currentGameIndex}</div>
 <div
 className={`turn-chip ${isMyTurn ? 'my-turn' : isBot ? 'bot-turn' : ''}`}
 style={isMyTurn ? {} : !isBot ? { borderColor: playerColorMap[currentTurnId]?.border, color: playerColorMap[currentTurnId]?.text } : {}}
 >
 {isMyTurn ? (
 <>
 <CrosshairIcon size={15} />
 <span className="turn-label-desktop">Your Turn — Select a Number</span>
 <span className="turn-label-mobile">Your Turn</span>
 </>
 ) : isBot ? (
 <div className="bot-turn-thinking">
 <BotIcon size={15} />
 <span>BingoBot is thinking...</span>
 </div>
 ) : (
 <span>{currentTurnPlayer?.name || '...'}'s Turn</span>
 )}
 </div>
 </div>

 <div className="topbar-right">
 <SoundToggle />
 <button
 className="btn btn-ghost leave-btn"
 onClick={leaveRoom}
 type="button"
 title="Leave Room"
 aria-label="Leave Room"
 >
 <LeaveIcon size={18} />
 </button>
 </div>
 </div>

 {/*  Main area  */}
 <div className="game-main">

 {/*  Left: My board  */}
 <div className="game-board-section">
 <div className="board-owner-label">
 <span>Your Board</span>
 <span className="board-name" style={{ color: playerColorMap[playerId]?.text }}>
 {myPlayer.name}
 </span>
 </div>

 {/* BINGO tracker */}
 <div className="bingo-tracker">
 {BINGO_LETTERS.map((letter, i) => (
 <div key={letter} className={`bingo-track-letter ${i < myBingoCount ? 'lit' : ''}`}>
 {letter}
 </div>
 ))}
 </div>

 {/* Board grid + SVG line overlay */}
 <div className="board-grid-wrapper">
 <div className={`game-board-grid ${!isMyTurn ? 'board-waiting-turn' : ''}`} ref={boardRef}>
 {myBoard.map((row, r) =>
 row.map((val, c) => {
 const isMarked = myMarked.has(val);
 const isAlreadyCalled = calledNumbers.includes(val);
 const isClickable = Boolean(isMyTurn && !isAlreadyCalled && !isMarked && roomData?.status === 'playing');
 const isSelected = Boolean(isMyTurn && selectedNumber === val && !isMarked && !isAlreadyCalled);

 // Color of the player who called this number
 const callerColor = isMarked ? playerColorMap[callerByNumber[val]] : null;

 const style = callerColor ? {
 background: callerColor.bg,
 borderColor: callerColor.border,
 color: callerColor.text,
 } : {};

 return (
 <div
 key={`${r}-${c}`}
 className={[
 'game-cell',
 isMarked ? 'marked' : '',
 isSelected ? 'selected' : '',
 isClickable ? 'clickable' : 'cell-disabled',
 ].filter(Boolean).join(' ')}
 style={style}
 onClick={isClickable ? (e) => {
 e.stopPropagation();
 handleCellClick(val);
 } : undefined}
 title={isClickable ? `Click to select ${val}` : !isMyTurn ? 'Wait for your turn' : ''}
 aria-disabled={!isClickable}
 >
 {val}
 </div>
 );
 })
 )}
 </div>

 {/* Continuous SVG lines for completed rows/cols/diagonals */}
 {Object.keys(lineCoords).length > 0 && (
 <svg
 className="board-lines-svg"
 width={svgSize.w}
 height={svgSize.h}
 style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
 >
 {Object.entries(lineCoords).map(([key, { x1, y1, x2, y2 }]) => (
 <line
 key={key}
 x1={x1} y1={y1} x2={x2} y2={y2}
 stroke="#4ade80"
 strokeWidth="3.5"
 strokeLinecap="round"
 opacity="0.85"
 />
 ))}
 </svg>
 )}
 </div>

 {/* Call bar */}
 {isMyTurn && roomData.status === 'playing' && (
 <div className="call-bar">
 {selectedNumber && !calledNumbers.includes(selectedNumber) && !myMarked.has(selectedNumber) ? (
 <>
 <button className="btn btn-primary call-confirm-btn" onClick={handleCallConfirm} type="button">
 <CheckIcon size={16} />
 <span>Announce #{selectedNumber}</span>
 </button>
 <button className="btn btn-ghost call-cancel-btn"
 onClick={() => { setSelectedNumber(null); setCallError(''); }}
 type="button">
 Cancel
 </button>
 </>
 ) : (
 <div className="call-bar-hint">
 <CrosshairIcon size={15} />
 <span>Click any unmarked number on your board to call it</span>
 </div>
 )}
 {callError && <div className="call-error">{callError}</div>}
 </div>
 )}

 {!isMyTurn && roomData.status === 'playing' && (
 <div className={`waiting-turn-msg ${isBot ? 'waiting-bot-msg' : ''}`} style={!isBot ? { borderColor: playerColorMap[currentTurnId]?.border } : {}}>
 {isBot ? (
 <div className="bot-eval-thinking">
 <BotIcon size={16} />
 <span>BingoBot is evaluating its board...</span>
 </div>
 ) : (
 <>
 Waiting for{' '}
 <strong style={{ color: playerColorMap[currentTurnId]?.text }}>
 {currentTurnPlayer?.name}
 </strong>{' '}
 to call a number...
 </>
 )}
 </div>
 )}
 </div>

 {/*  Right panel  */}
 <div className="game-right-panel">

 {/* Called numbers log */}
 <div className="called-log">
 <h3>Last Called</h3>
 {lastCalled ? (
 <div className="last-called-badge">
 <span className="called-num-ball" style={{ background: playerColorMap[callerByNumber[lastCalled]]?.border }}>
 {lastCalled}
 </span>
 <div className="called-details">
 <span className="called-title">Number {lastCalled}</span>
 {callerByNumber[lastCalled] && (
 <span className="last-caller" style={{ color: playerColorMap[callerByNumber[lastCalled]]?.text }}>
 Called by {players.find(p => p.id === callerByNumber[lastCalled])?.name}
 </span>
 )}
 </div>
 </div>
 ) : (
 <div className="no-calls-yet">No numbers called yet</div>
 )}
 </div>

 {/* Other players */}
 <div className="other-players">
 <h3>{isBot ? 'Opponent' : 'Other Players'}</h3>
 {players.filter(p => p.id !== playerId).map(p => {
 const pLines = new Set(p.bingoLines || []);
 const isCurrentTurn = p.id === currentTurnId;
 const color = playerColorMap[p.id];
 return (
 <div
 key={p.id}
 className={`other-player-card ${isCurrentTurn ? "active-turn" : ""} ${isBot ? "bot-player-card" : ""}`}
 style={isCurrentTurn ? { borderColor: color?.border, boxShadow: `0 0 12px ${color?.border}44` } : {}}
 >
 <div className="opc-header">
 <div className="opc-identity">
 <div className="opc-name" style={{ color: color?.text }}>
 {isBot && <BotIcon size={15} style={{ marginRight: 5, verticalAlign: 'middle' }} />}
 <span>{p.name}</span>
 {!isBot && p.id === roomData.creatorId && (
 <span className="creator-badge" title="Room Host">
 <CrownIcon size={12} />
 </span>
 )}
 {isCurrentTurn && <span className="opc-turn-pill">Turn</span>}
 </div>
 {isBot && (
 <div className="opc-subline">
 <span className={`diff-tag diff-${roomData.difficulty || 'pro'}`}>
 {(roomData.difficulty || 'pro').toUpperCase()}
 </span>
 </div>
 )}
 </div>
 <div className="opc-bingo-mini">
 {BINGO_LETTERS.map((l, i) => (
 <span
 key={l}
 className={`bingo-mini-letter ${i < pLines.size ? "lit" : ""}`}
 style={i < pLines.size ? { background: color?.border, borderColor: color?.border } : {}}
 >
 {l}
 </span>
 ))}
 </div>
 </div>

 <div className="opc-wins" style={{ color: color?.text }}>
 <TrophyIcon size={12} />
 <span>{p.wins || 0} win{p.wins !== 1 ? "s" : ""}</span>
 </div>
 </div>
 );
 })}
 </div>

 {/* Game history */}
 {roomData.gameHistory?.length > 0 && (() => {
 const historyList = roomData.gameHistory;
 const shouldTruncate = historyList.length > MAX_HISTORY_ROWS;
 const visibleHistory = shouldTruncate && !historyExpanded
 ? historyList.slice(0, MAX_HISTORY_ROWS)
 : historyList;

 return (
 <div className="game-history-panel">
 <h3>Game History</h3>
 {visibleHistory.map(g => (
 <div key={g.gameIndex} className="gh-row">
 <span className="gh-game">Round #{g.gameIndex}</span>
 <span className="gh-winner">
 <TrophyIcon size={13} className="trophy-gold" />
 <span>{g.winners.map(w => w.name).join(", ")}</span>
 </span>
 </div>
 ))}

 {shouldTruncate && (
 <button
 type="button"
 className="history-toggle-row"
 onClick={() => setHistoryExpanded(prev => !prev)}
 aria-expanded={historyExpanded}
 >
 <span>{historyExpanded ? 'Collapse' : `Show all (${historyList.length})`}</span>
 {historyExpanded ? (
 <TriangleUpIcon size={11} className="triangle-icon" />
 ) : (
 <TriangleDownIcon size={11} className="triangle-icon" />
 )}
 </button>
 )}
 
 <h3 style={{ marginTop: '16px' }}>All-Time Wins</h3>
 <div className="leaderboard-list">
 {[
 ...players.map(p => ({ id: p.id, name: p.name, wins: p.wins || 0, active: true })),
 ...Object.values(roomData.leftPlayers || {}).map((p, idx) => ({ id: `left-${idx}`, name: p.name, wins: p.wins || 0, active: false }))
 ]
 .sort((a, b) => b.wins - a.wins)
 .map((p, idx) => (
 <div key={p.id} className="gh-row" style={{ opacity: p.active ? 1 : 0.6 }}>
 <span>
 {idx === 0 && p.wins > 0 && <TrophyIcon size={12} className="trophy-gold" />}
 {p.name} {p.active ? '' : '(Left)'}
 </span>
 <strong>{p.wins}</strong>
 </div>
 ))}
 </div>
 </div>
 );
 })()}
      </div>
    </div>
  </div>
  );
}
