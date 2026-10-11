import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SoundToggle from '../components/SoundToggle';
import { CopyIcon, ShareIcon, CheckIcon, ShuffleIcon, TrashIcon, PencilIcon, CrownIcon, ClockIcon, PlayIcon, TrophyIcon } from '../components/Icons';
import { triggerShare, copyToClipboard } from '../utils/shareUtils';
import './BoardSetup.css';

function generateRandomBoard() {
 const nums = Array.from({ length: 25 }, (_, i) => i + 1);
 for (let i = nums.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [nums[i], nums[j]] = [nums[j], nums[i]];
 }
 const board = [];
 for (let r = 0; r < 5; r++) board.push(nums.slice(r * 5, r * 5 + 5));
 return board;
}

export default function BoardSetup() {
 const navigate = useNavigate();
 const { roomData, myPlayer, playerName, isCreator, playerId, submitBoard, startGame, leaveRoom, showNotif, setShareModalData } = useGame();

 // board[r][c] = number | null
 const [board, setBoard] = useState(Array.from({ length: 5 }, () => Array(5).fill(null)));
 const [autoSeq, setAutoSeq] = useState(1); // next sequential number
 const [manualMode, setManualMode] = useState(false);
 const [manualInput, setManualInput] = useState('');
 const [manualTarget, setManualTarget] = useState(null); // {r,c}
 const [inputError, setInputError] = useState('');
 const [submitted, setSubmitted] = useState(false);
 const [startError, setStartError] = useState('');

 // Redirect if no room
 useEffect(() => {
 if (!roomData) navigate('/lobby');
 }, [roomData, navigate]);

 const gameIndex = roomData?.currentGameIndex ?? 0;
 const stableName = myPlayer?.name || playerName || '';
 const storageKey = roomData?.id ? `bingo_setup_${roomData.id}_${stableName}` : null;
 const legacyKey = roomData?.id && playerId ? `bingo_setup_${roomData.id}_${playerId}` : null;
 const isLocked = submitted || Boolean(myPlayer?.ready);

 // 1) Restore or Reset
 useEffect(() => {
   if (!roomData?.id) return;

   // A) If server already has our 5x5 board and we are ready, restore it immediately
   if (myPlayer?.ready && Array.isArray(myPlayer.board) && myPlayer.board.length === 5 && myPlayer.board.flat().length === 25) {
     setBoard(myPlayer.board);
     setSubmitted(true);
     return;
   }

   // B) Try restoring from localStorage (stable key or fallback legacy key)
   try {
     const saved = (storageKey ? localStorage.getItem(storageKey) : null) || (legacyKey ? localStorage.getItem(legacyKey) : null);
     if (saved) {
       const parsed = JSON.parse(saved);
       if (parsed.gameIndex === gameIndex) {
         if (parsed.board && Array.isArray(parsed.board) && parsed.board.length === 5) {
           setBoard(parsed.board);
         }
         if (parsed.autoSeq) setAutoSeq(parsed.autoSeq);
         if (parsed.submitted || myPlayer?.ready) {
           setSubmitted(true);
         }
         return;
       }
     }
   } catch {}

   // C) If server says ready, definitely mark submitted
   if (myPlayer?.ready) {
     setSubmitted(true);
     return;
   }

   // D) Otherwise fresh game reset
   setBoard(Array.from({ length: 5 }, () => Array(5).fill(null)));
   setAutoSeq(1);
   setManualMode(false);
   setManualInput('');
   setManualTarget(null);
   setInputError('');
   setSubmitted(false);
   setStartError('');
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [gameIndex, roomData?.id, stableName, myPlayer?.ready, myPlayer?.board]);

 // 2) Save to localStorage
 useEffect(() => {
   if (!storageKey) return;
   const filledCount = board.flat().filter(Boolean).length;
   // Guard: Don't overwrite saved board with empty board if player is already ready
   if (myPlayer?.ready && filledCount === 0) return;

   try {
     localStorage.setItem(storageKey, JSON.stringify({
       gameIndex,
       board,
       autoSeq,
       submitted: submitted || Boolean(myPlayer?.ready)
     }));
   } catch {}
 }, [storageKey, board, autoSeq, submitted, gameIndex, myPlayer?.ready]);

 const usedNumbers = board.flat().filter(Boolean);
 const totalFilled = usedNumbers.length;
 const isBoardFull = totalFilled === 25;

  function handleCellClick(r, c) {
    if (isLocked) return;

    const cellValue = board[r][c];

    // Manual keyboard mode
    if (manualMode) {
      setManualTarget({ r, c });
      setInputError('');
      return;
    }

    // Deselect cell (click a filled cell to clear it)
    if (cellValue !== null) {
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = null;
      setBoard(newBoard);
      return;
    }

    // Auto-fill next sequential number: find lowest available number 1-25 not currently on the board
    const allUsedNow = new Set(board.flat().filter(Boolean));
    let next = 1;
    while (next <= 25 && allUsedNow.has(next)) {
      next++;
    }

    if (next > 25) {
      showNotif('All numbers 1-25 have been used!', 'info');
      return;
    }

    const newBoard2 = board.map(row => [...row]);
    newBoard2[r][c] = next;
    setBoard(newBoard2);
  }

 function handleManualInput() {
 if (!manualTarget) { setInputError('Click a cell first'); return; }
 const num = parseInt(manualInput, 10);
 if (isNaN(num) || num < 1 || num > 25) {
 setInputError('Enter a number between 1 and 25');
 return;
 }
 const allUsed = board.flat().filter(Boolean);
 const cellHas = board[manualTarget.r][manualTarget.c];
 if (allUsed.includes(num) && cellHas !== num) {
 setInputError(`Number ${num} is already on your board!`);
 return;
 }
 const newBoard = board.map(row => [...row]);
 newBoard[manualTarget.r][manualTarget.c] = num;
 setBoard(newBoard);
 setManualInput('');
 setManualTarget(null);
 setInputError('');
 }

 function handleAutoFill() {
 setBoard(generateRandomBoard());
 setAutoSeq(26);
 setManualTarget(null);
 setManualInput('');
 }

 function handleClearBoard() {
 setBoard(Array.from({ length: 5 }, () => Array(5).fill(null)));
 setAutoSeq(1);
 setManualTarget(null);
 setManualInput('');
 }

  function handleSubmit() {
    const flat = board.flat();
    if (flat.some(n => n === null || n === undefined)) {
      showNotif('Fill all 25 cells before submitting!', 'warning');
      return;
    }
    if (new Set(flat).size !== 25) {
      showNotif('Your board contains duplicate numbers! Please fix it.', 'error');
      return;
    }
    submitBoard(board, (res) => {
      if (res.success) {
        setSubmitted(true);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify({
              gameIndex,
              board,
              autoSeq,
              submitted: true
            }));
          } catch {}
        }
      } else {
        showNotif(res.error, 'error');
      }
    });
  }

  function handleStartGame() {
    setStartError('');
    startGame((res) => {
      if (!res.success) setStartError(res.error);
    });
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
      showNotif('Room ID copied!', 'success');
    } catch {
      showNotif(`Room Code: ${roomData?.id}`, 'info');
    }
  };

  const players = roomData?.players || [];
  const readyCount = players.filter(p => p.ready).length;
  const allReady = players.length >= 2 && readyCount === players.length;

  return (
    <div className="board-setup-page">
      {/* Header bar */}
      <div className="setup-header">
        <div className="room-info-bar">
          <span className="room-label">Room</span>
          <span className="room-id-display">{roomData?.id}</span>
          <button
            className="copy-btn"
            title="Copy Room ID"
            onClick={handleCopyId}
            type="button"
          >
            <CopyIcon size={13} />
            <span>Copy</span>
          </button>
          <button
            className="copy-btn share-btn"
            title="Share Room"
            onClick={handleShare}
            type="button"
          >
            <ShareIcon size={13} />
            <span>Share</span>
          </button>
        </div>
 <div className="game-num-badge">Round #{roomData?.currentGameIndex}</div>
 <div className="setup-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <SoundToggle />
 <button className="btn btn-ghost leave-btn" onClick={leaveRoom} type="button">Leave</button>
 </div>
 </div>

 <div className="setup-main">
 {/* Board area */}
 <div className="board-section">
 <div className="setup-board-title">
 {isLocked ? (
 <div className="ready-badge">
 <CheckIcon size={16} />
 <span>Board Submitted — Waiting for others...</span>
 </div>
 ) : (
 <div className="board-title-text">
 <span>Arrange Your Board</span>
 <span className="fill-count">({totalFilled}/25 Filled)</span>
 </div>
 )}
 </div>

 {/* Board grid */}
 <div className={`board-grid ${isLocked ? 'locked' : ''}`}>
 {board.map((row, r) =>
 row.map((val, c) => {
 const isTarget = manualTarget?.r === r && manualTarget?.c === c;
 const isEmpty = val === null;
 return (
 <button
 key={`${r}-${c}`}
 className={`board-cell ${isEmpty ? 'empty' : 'filled'} ${isTarget ? 'targeted' : ''}`}
 onClick={() => handleCellClick(r, c)}
 disabled={isLocked}
 type="button"
 >
 {val ?? ''}
 </button>
 );
 })
 )}
 </div>

 {/* Controls */}
 {!isLocked && (
 <div className="board-controls">
 <div className="controls-row">
 <button
 className={`btn btn-sm ${manualMode ? 'btn-accent' : 'btn-outline'}`}
 onClick={() => { setManualMode(!manualMode); setManualTarget(null); setInputError(''); }}
 type="button"
 >
 <PencilIcon size={14} />
 <span>{manualMode ? 'Auto Mode' : 'Manual Input'}</span>
 </button>
 <button className="btn btn-sm btn-outline" onClick={handleAutoFill} type="button">
 <ShuffleIcon size={14} />
 <span>Random Fill</span>
 </button>
 <button className="btn btn-sm btn-danger" onClick={handleClearBoard} type="button">
 <TrashIcon size={14} />
 <span>Clear</span>
 </button>
 </div>

 {manualMode && (
 <div className="manual-input-row">
 <span className="manual-hint">
 {manualTarget ? `Target cell: Row ${manualTarget.r + 1}, Col ${manualTarget.c + 1}` : 'Click any cell on the board to target'}
 </span>
 <div className="manual-input-group">
 <input
 type="number"
 min={1} max={25}
 placeholder="1-25"
 value={manualInput}
 onChange={e => setManualInput(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && handleManualInput()}
 />
 <button className="btn btn-sm btn-primary" onClick={handleManualInput} type="button">Set</button>
 </div>
 {inputError && <div className="input-error">{inputError}</div>}
 </div>
 )}



 <button
 className="btn btn-primary submit-board-btn"
 onClick={handleSubmit}
 disabled={!isBoardFull}
 type="button"
 >
 <CheckIcon size={18} />
 <span>Submit Board Ready</span>
 </button>
 </div>
 )}
 </div>

 {/* Players sidebar */}
 <div className="players-sidebar">
 <h3>Players in Room</h3>
 <div className="players-list">
 {players.map(p => (
 <div key={p.id} className={`player-row ${p.id === playerId ? 'me' : ''}`}>
 <div className="player-name">
 <span>{p.name}</span>
 {p.id === roomData?.creatorId && (
 <span className="creator-badge" title="Room Host">
 <CrownIcon size={13} />
 </span>
 )}
 {p.id === playerId && <span className="you-badge">(You)</span>}
 </div>
 <div className={`player-status ${p.ready ? 'ready' : 'filling'}`}>
 {p.ready ? (
 <>
 <CheckIcon size={13} />
 <span>Ready</span>
 </>
 ) : (
 <>
 <ClockIcon size={13} />
 <span>Setting up...</span>
 </>
 )}
 </div>
 </div>
 ))}
 </div>

 <div className="ready-summary">
 {readyCount}/{players.length} Players Ready
 </div>

 {isCreator && (
 <div className="start-section">
 <button
 className="btn btn-primary start-btn"
 onClick={handleStartGame}
 disabled={!allReady}
 title={!allReady ? 'All players must be ready' : 'Start the game!'}
 type="button"
 >
 <PlayIcon size={18} />
 <span>Launch Match</span>
 </button>
 {!allReady && (
 <div className="start-hint">
 {players.length < 2 ? 'Need at least 2 players' : 'Waiting for all players to submit boards'}
 </div>
 )}
 {startError && <div className="form-error">{startError}</div>}
 </div>
 )}

 {!isCreator && allReady && (
 <div className="waiting-creator">
 <ClockIcon size={14} />
 <span>Waiting for host to launch the match...</span>
 </div>
 )}

 {roomData?.gameHistory?.length > 0 && (
 <div className="game-history-mini">
 <h4>Previous Games</h4>
 {roomData.gameHistory.map(g => (
 <div key={g.gameIndex} className="history-row">
 <span className="history-game">Game {g.gameIndex}</span>
 <span className="history-winner">
 <TrophyIcon size={12} className="trophy-gold" />
 <span>{g.winners.map(w => w.name).join(', ')}</span>
 </span>
 </div>
 ))}
 
 <h4 style={{ marginTop: '15px' }}>All-Time Wins</h4>
 <div className="leaderboard-list">
  {[
    ...players.map(p => ({ id: p.id, name: p.name, wins: p.wins || 0, active: true })),
    ...Object.values(roomData.leftPlayers || {}).map((p, idx) => ({ id: `left-${idx}`, name: p.name, wins: p.wins || 0, active: false }))
  ]
  .sort((a, b) => b.wins - a.wins)
  .map(p => (
    <div key={p.id} className="history-row" style={{ opacity: p.active ? 1 : 0.6 }}>
      <span>{p.name} {p.active ? '' : '(Left)'}</span>
      <span className="history-winner">
        <TrophyIcon size={12} className="trophy-gold" />
        <strong>{p.wins}</strong>
      </span>
    </div>
  ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
