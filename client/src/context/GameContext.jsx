import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import { 
  getPersistentPlayerName, 
  getPersistentPlayerNameSync, 
  setPersistentPlayerName 
} from '../utils/storageUtils';
import { 
  generateBotBoard, 
  getBotNextMove, 
  checkBingoLines 
} from '../utils/botEngine';
import { trackBotGame } from '../services/analytics';

const GameContext = createContext(null);

// Session storage helpers (cleared on tab/window close, persists on refresh)
const SESSION_KEY = 'bingo_session';

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadSession() {
  try { const d = localStorage.getItem(SESSION_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState(() => getPersistentPlayerNameSync() || '');
  const [roomData, setRoomData] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [notification, setNotification] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);
  const [inactivityWarning, setInactivityWarning] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const notifTimer = useRef(null);
  const botSecretBoardRef = useRef(null);
  const botTurnTimerRef = useRef(null);
  const botInactivityTimerRef = useRef(null);
  const botInactivityWarningTimerRef = useRef(null);
  const lastUserActivityRef = useRef(Date.now());

  const showNotif = useCallback((msg, type = 'info', duration = 3500) => {
    setNotification({ msg, type });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), duration);
  }, []);

  // 1. Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setPlayerName(session.playerName || '');
      setPlayerId(session.playerId || '');

      // Offline / Bot Match Session Restore
      if (session.isBot && session.roomData) {
        // Reconstruct Sets for players; ensure setup phase is never locked as ready
        const isPlaying = session.roomData.status === 'playing';
        const restoredPlayers = (session.roomData.players || []).map(p => ({
          ...p,
          ready: isPlaying ? Boolean(p.ready) : (p.id === 'bot-opponent' ? true : false),
          markedCells: new Set(p.markedCells || []),
          bingoLines: Array.isArray(p.bingoLines) ? p.bingoLines : [...(p.bingoLines || [])]
        }));

        const restoredRoom = {
          ...session.roomData,
          players: restoredPlayers
        };

        setRoomData(restoredRoom);
        botSecretBoardRef.current = session.botSecretBoard || null;

        if (isPlaying) {
          navigate('/game');
        } else {
          navigate('/board-setup');
        }
      }
    } else {
      getPersistentPlayerName().then(saved => {
        if (saved) setPlayerName(saved);
      });
    }
  }, [navigate]);

  // 2. Auto-rejoin on socket connect (Multiplayer only)
  useEffect(() => {
    if (!socket) return;
    const session = loadSession();
    if (session && session.roomId && session.playerName && session.playerId && !session.isBot) {
      const cleanRoomId = session.roomId.trim().toUpperCase();
      socket.emit('room:rejoin', {
        name: session.playerName.trim(),
        roomId: cleanRoomId,
        oldPlayerId: session.playerId
      }, (res) => {
        if (res.success) {
          setPlayerId(res.playerId);
          saveSession({ ...session, roomId: cleanRoomId, playerId: res.playerId });
          if (res.status === 'playing') {
            navigate('/game');
          } else {
            navigate('/board-setup');
          }
        } else {
          clearSession();
        }
      });
    }
  }, [socket, navigate]);

  // 3. Socket event listeners for multiplayer rooms
  useEffect(() => {
    if (!socket) return;

    socket.on('room:update', (data) => {
      // Do not overwrite local offline bot match with socket updates
      if (roomData?.isBot) return;
      setRoomData(data);
      if (data.status === 'filling') {
        setGameOver(null);
      }
    });

    socket.on('game:started', () => {
      if (roomData?.isBot) return;
      navigate('/game');
    });

    socket.on('game:replaying', () => {
      if (roomData?.isBot) return;
      setGameOver(null);
      navigate('/board-setup');
    });

    socket.on('game:over', ({ winners, gameHistory }) => {
      if (roomData?.isBot) return;
      setGameOver({ winners, gameHistory });
    });

    socket.on('player:left', ({ name }) => {
      showNotif(`${name} left the room`, 'warning');
    });

    socket.on('room:inactivityWarning', (payload) => {
      if (roomData?.isBot) return;
      setInactivityWarning(payload || { countdown: 10, isSolo: false });
    });

    socket.on('room:inactivityCancelled', ({ savedBy } = {}) => {
      if (roomData?.isBot) return;
      setInactivityWarning(null);
      if (savedBy) {
        showNotif(`${savedBy} kept the room active.`, 'success', 3000);
      }
    });

    socket.on('room:deletedForInactivity', ({ message }) => {
      if (roomData?.isBot) return;
      setInactivityWarning(null);
      clearSession();
      setRoomData(null);
      setPlayerId('');
      setGameOver(null);
      showNotif(message || 'Room was closed due to inactivity.', 'warning', 5000);
      navigate('/');
    });

    const handleRoomDestroyed = ({ message }) => {
      if (roomData?.isBot) return;
      showNotif(message, 'warning', 5000);
      clearSession();
      setRoomData(null);
      setPlayerId('');
      const persistent = getPersistentPlayerNameSync();
      setPlayerName(persistent || '');
      setGameOver(null);
      navigate('/');
    };

    socket.on('room:destroyed', handleRoomDestroyed);

    return () => {
      socket.off('room:update');
      socket.off('game:started');
      socket.off('game:replaying');
      socket.off('game:over');
      socket.off('player:left');
      socket.off('room:inactivityWarning');
      socket.off('room:inactivityCancelled');
      socket.off('room:deletedForInactivity');
      socket.off('room:destroyed', handleRoomDestroyed);
    };
  }, [socket, navigate, showNotif, roomData?.isBot]);

  // -------------------------------------------------------------
  // BOT MODE INITIALIZATION (100% Offline Ready)
  // -------------------------------------------------------------
  const startBotGame = useCallback((name, difficulty = 'pro', cb) => {
    const cleanName = (name || '').trim();
    const myId = 'player-user';
    const botId = 'bot-opponent';

    const botBoard = generateBotBoard(difficulty);
    botSecretBoardRef.current = botBoard;

    const userPlayer = {
      id: myId,
      name: cleanName,
      board: [],
      markedCells: new Set(),
      bingoLines: [],
      ready: false,
      wins: 0
    };

    const botPlayer = {
      id: botId,
      name: 'BingoBot',
      difficulty,
      board: [], // Hidden during match for fair play
      secretBoard: botBoard,
      markedCells: new Set(),
      bingoLines: [],
      ready: true,
      wins: 0
    };

    // Clean up any stale bot setup keys from past sessions
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('bingo_setup_BOT')) localStorage.removeItem(k);
      });
    } catch {}

    const botRoomId = `BOT-${difficulty.toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const newRoomData = {
      id: botRoomId,
      isBot: true,
      difficulty,
      status: 'filling',
      creatorId: myId,
      players: [userPlayer, botPlayer],
      turnOrder: [],
      currentTurnIndex: 0,
      calledNumbers: [],
      calledHistory: [],
      gameHistory: [],
      currentGameIndex: 1,
      lastActivity: Date.now()
    };

    setPlayerName(cleanName);
    setPersistentPlayerName(cleanName);
    setPlayerId(myId);
    setRoomData(newRoomData);
    setGameOver(null);
    setInactivityWarning(null);

    // Persist bot session
    saveSession({
      playerName: cleanName,
      playerId: myId,
      roomId: newRoomData.id,
      isBot: true,
      difficulty,
      botSecretBoard: botBoard,
      roomData: {
        ...newRoomData,
        players: newRoomData.players.map(p => ({
          ...p,
          markedCells: [...p.markedCells],
          bingoLines: [...p.bingoLines]
        }))
      }
    });

    navigate('/board-setup');
    if (cb) cb({ success: true, roomId: newRoomData.id, playerId: myId });
  }, [navigate]);

  // Helper to persist current bot room state
  const syncBotSession = useCallback((updatedRoom) => {
    if (!updatedRoom?.isBot) return;
    const session = loadSession() || {};
    saveSession({
      ...session,
      isBot: true,
      botSecretBoard: botSecretBoardRef.current,
      roomData: {
        ...updatedRoom,
        players: updatedRoom.players.map(p => ({
          ...p,
          markedCells: [...p.markedCells],
          bingoLines: [...p.bingoLines]
        }))
      }
    });
  }, []);

  // -------------------------------------------------------------
  // MULTIPLAYER ROOM CREATION & JOINING
  // -------------------------------------------------------------
  const createRoom = useCallback((name, cb) => {
    const cleanName = (name || '').trim();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (cb) cb({ 
        success: false, 
        error: 'You appear to be offline. Could not connect to the internet to create a room. Try playing against BingoBot offline!' 
      });
      return;
    }

    if (!socket || !socket.connected) {
      if (cb) cb({ 
        success: false, 
        error: 'Unable to connect to the game server. Please check your internet connection or try again in a few moments.' 
      });
      return;
    }

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        if (cb) cb({
          success: false,
          error: 'Connection timed out. The server is currently unreachable. Please check your internet connection.'
        });
      }
    }, 6000);

    socket.emit('room:create', { name: cleanName }, (res) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);
      if (res?.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        saveSession({ playerName: cleanName, playerId: res.playerId, roomId: res.roomId, isBot: false });
        navigate('/board-setup');
      }
      if (cb) cb(res || { success: false, error: 'Failed to create room' });
    });
  }, [socket, navigate]);

  const joinRoom = useCallback((name, roomId, cb) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const cleanName = (name || '').trim();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (cb) cb({ 
        success: false, 
        error: 'You appear to be offline. Could not connect to the internet to join a room. Try playing against BingoBot offline!' 
      });
      return;
    }

    if (!socket || !socket.connected) {
      if (cb) cb({ 
        success: false, 
        error: 'Unable to connect to the game server. Please check your internet connection or try again in a few moments.' 
      });
      return;
    }

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        if (cb) cb({
          success: false,
          error: 'Connection timed out. The server is currently unreachable. Please check your internet connection.'
        });
      }
    }, 6000);

    socket.emit('room:join', { name: cleanName, roomId: cleanRoomId }, (res) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);
      if (res?.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        saveSession({ playerName: cleanName, playerId: res.playerId, roomId: cleanRoomId, isBot: false });
        navigate('/board-setup');
      }
      if (cb) cb(res || { success: false, error: 'Failed to join room' });
    });
  }, [socket, navigate]);

  // -------------------------------------------------------------
  // SUBMIT BOARD
  // -------------------------------------------------------------
  const submitBoard = useCallback((board, cb) => {
    if (roomData?.isBot) {
      const myId = playerId || 'player-user';
      const botId = 'bot-opponent';

      // 1. Update user player
      const userPlayer = {
        ...(roomData.players.find(p => p.id === myId) || {}),
        id: myId,
        board,
        ready: true,
        markedCells: new Set(),
        bingoLines: []
      };

      // 2. Refresh bot player
      const botBoard = botSecretBoardRef.current || generateBotBoard(roomData.difficulty);
      botSecretBoardRef.current = botBoard;

      const botPlayer = {
        ...(roomData.players.find(p => p.id === botId) || {}),
        id: botId,
        name: 'BingoBot',
        difficulty: roomData.difficulty,
        board: [], // keep hidden during game
        secretBoard: botBoard,
        ready: true,
        markedCells: new Set(),
        bingoLines: []
      };

      // 3. Determine turn order following existing algorithm:
      // - Multiple rounds in same room: winner of last game starts first
      // - First round (or tie): 50/50 fair coin toss shuffle
      let firstTurnId = null;
      if (roomData.gameHistory && roomData.gameHistory.length > 0) {
        const lastGame = roomData.gameHistory[roomData.gameHistory.length - 1];
        if (lastGame?.winners?.length > 0) {
          const winnerMatch = lastGame.winners.find(w => w.id === myId || w.id === botId);
          if (winnerMatch) {
            firstTurnId = winnerMatch.id;
          }
        }
      }

      if (!firstTurnId) {
        firstTurnId = Math.random() < 0.5 ? myId : botId;
      }
      const secondTurnId = firstTurnId === myId ? botId : myId;
      const turnOrder = [firstTurnId, secondTurnId];

      const playingRoom = {
        ...roomData,
        status: 'playing',
        players: [userPlayer, botPlayer],
        turnOrder,
        currentTurnIndex: 0,
        calledNumbers: [],
        calledHistory: [],
        lastActivity: Date.now()
      };

      setRoomData(playingRoom);
      syncBotSession(playingRoom);
      navigate('/game');
      if (cb) cb({ success: true });
      return;
    }

    // Multiplayer
    if (!socket) return;
    socket.emit('board:submit', { board }, (res) => {
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, navigate, socket]);

  const startGame = useCallback((cb) => {
    if (roomData?.isBot) {
      if (cb) cb({ success: true });
      return;
    }
    if (!socket) return;
    socket.emit('game:start', {}, (res) => {
      if (cb) cb(res);
    });
  }, [roomData?.isBot, socket]);

  // -------------------------------------------------------------
  // CALL NUMBER (User or Bot)
  // -------------------------------------------------------------
  const callNumber = useCallback((number, cb, isBotCall = false) => {
    if (roomData?.isBot) {
      if (roomData.status !== 'playing') {
        if (cb) cb({ success: false, error: 'Game not in progress' });
        return;
      }

      const currentTurnPlayerId = roomData.turnOrder?.[roomData.currentTurnIndex];
      const effectivePlayerId = playerId || 'player-user';

      // Turn Validation Guard: Only allow moves during the caller's legitimate turn
      if (!isBotCall && currentTurnPlayerId !== effectivePlayerId) {
        if (cb) cb({ success: false, error: "Not your turn! Wait for BingoBot's move." });
        return;
      }
      if (isBotCall && currentTurnPlayerId !== 'bot-opponent') {
        if (cb) cb({ success: false, error: 'Bot move ignored (not bot turn)' });
        return;
      }

      const num = parseInt(number, 10);
      if (roomData.calledNumbers.includes(num)) {
        if (cb) cb({ success: false, error: 'Number already called' });
        return;
      }
      if (isNaN(num) || num < 1 || num > 25) {
        if (cb) cb({ success: false, error: 'Invalid number' });
        return;
      }

      const updatedCalled = [...roomData.calledNumbers, num];
      const updatedHistory = [...roomData.calledHistory, { number: num, calledById: currentTurnPlayerId }];

      const userPlayer = roomData.players.find(p => p.id === effectivePlayerId);
      const botPlayer = roomData.players.find(p => p.id === 'bot-opponent');
      const botBoard = botSecretBoardRef.current || botPlayer.secretBoard;

      // 1. Mark on user board
      const newUserMarked = new Set([...userPlayer.markedCells].map(Number));
      if (userPlayer.board.flat().map(Number).includes(num)) {
        newUserMarked.add(num);
      }
      const userCompletedLines = checkBingoLines(userPlayer.board, newUserMarked);

      // 2. Mark on bot board (fairly from bot's own secret board)
      const newBotMarked = new Set([...botPlayer.markedCells].map(Number));
      if (botBoard.flat().map(Number).includes(num)) {
        newBotMarked.add(num);
      }
      const botCompletedLines = checkBingoLines(botBoard, newBotMarked);

      const updatedUserPlayer = {
        ...userPlayer,
        markedCells: newUserMarked,
        bingoLines: userCompletedLines
      };

      const updatedBotPlayer = {
        ...botPlayer,
        markedCells: newBotMarked,
        bingoLines: botCompletedLines
      };

      // 3. Check for 5 lines victory (B-I-N-G-O)
      const winners = [];
      if (userCompletedLines.length >= 5) {
        winners.push({
          id: updatedUserPlayer.id,
          name: updatedUserPlayer.name,
          wins: (updatedUserPlayer.wins || 0) + 1
        });
        updatedUserPlayer.wins = (updatedUserPlayer.wins || 0) + 1;
      }

      if (botCompletedLines.length >= 5) {
        winners.push({
          id: updatedBotPlayer.id,
          name: updatedBotPlayer.name,
          wins: (updatedBotPlayer.wins || 0) + 1
        });
        updatedBotPlayer.wins = (updatedBotPlayer.wins || 0) + 1;
      }

      if (winners.length > 0) {
        // MATCH OVER!
        const userWon = winners.some(w => w.id === effectivePlayerId);
        const botWon = winners.some(w => w.id === 'bot-opponent');
        let winnerResult = 'tie';
        if (userWon && !botWon) winnerResult = 'user';
        else if (botWon && !userWon) winnerResult = 'bot';

        trackBotGame({
          difficulty: roomData.difficulty || 'pro',
          winner: winnerResult
        });

        const gameHistoryEntry = {
          gameIndex: roomData.currentGameIndex,
          winners: winners.map(w => ({ name: w.name, id: w.id }))
        };
        const nextGameHistory = [...(roomData.gameHistory || []), gameHistoryEntry];

        // Reveal bot board on game over so user can inspect it
        updatedBotPlayer.board = botBoard;

        const finishedRoom = {
          ...roomData,
          status: 'finished',
          players: [updatedUserPlayer, updatedBotPlayer],
          calledNumbers: updatedCalled,
          calledHistory: updatedHistory,
          gameHistory: nextGameHistory,
          lastActivity: Date.now()
        };

        setRoomData(finishedRoom);
        syncBotSession(finishedRoom);
        setGameOver({
          winners,
          gameHistory: nextGameHistory,
          botBoard,
          botMarkedCells: Array.from(newBotMarked),
          botBingoLines: botCompletedLines,
          lastCalledNumber: num,
          calledNumbers: updatedCalled
        });

        if (cb) cb({ success: true });
        return;
      }

      // Next turn
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextTurnRoom = {
        ...roomData,
        players: [updatedUserPlayer, updatedBotPlayer],
        calledNumbers: updatedCalled,
        calledHistory: updatedHistory,
        currentTurnIndex: nextTurnIndex,
        lastActivity: Date.now()
      };

      setRoomData(nextTurnRoom);
      syncBotSession(nextTurnRoom);
      if (cb) cb({ success: true });
      return;
    }

    // Multiplayer
    if (!socket) return;
    socket.emit('game:callNumber', { number }, (res) => {
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, socket]);

  // -------------------------------------------------------------
  // BOT AUTOMATIC TURN EXECUTION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!roomData?.isBot || roomData?.status !== 'playing' || gameOver) return;

    const currentTurnPlayerId = roomData.turnOrder?.[roomData.currentTurnIndex];
    if (currentTurnPlayerId !== 'bot-opponent') return;

    clearTimeout(botTurnTimerRef.current);
    // Natural human-like thinking delay (750ms - 1100ms)
    const thinkingDelay = 750 + Math.floor(Math.random() * 350);

    botTurnTimerRef.current = setTimeout(() => {
      const botPlayer = roomData.players.find(p => p.id === 'bot-opponent');
      const botBoard = botSecretBoardRef.current || botPlayer?.secretBoard;

      if (!botBoard) return;

      const botMove = getBotNextMove({
        botBoard,
        calledNumbers: roomData.calledNumbers || [],
        difficulty: roomData.difficulty || 'pro'
      });

      if (botMove !== null && botMove !== undefined) {
        callNumber(botMove, null, true);
      }
    }, thinkingDelay);

    return () => clearTimeout(botTurnTimerRef.current);
  }, [
    roomData?.isBot, 
    roomData?.status, 
    roomData?.turnOrder, 
    roomData?.currentTurnIndex, 
    roomData?.calledNumbers,
    gameOver, 
    callNumber
  ]);

  // -------------------------------------------------------------
  // REPLAY GAME
  // -------------------------------------------------------------
  const replayGame = useCallback((cb) => {
    if (roomData?.isBot) {
      setGameOver(null);

      // Generate a fresh new board for the bot
      const newBotBoard = generateBotBoard(roomData.difficulty);
      botSecretBoardRef.current = newBotBoard;

      const myId = playerId || 'player-user';
      const userPlayer = roomData.players.find(p => p.id === myId) || {};
      const botPlayer = roomData.players.find(p => p.id === 'bot-opponent') || {};

      const resetUserPlayer = {
        ...userPlayer,
        board: [],
        ready: false,
        markedCells: new Set(),
        bingoLines: []
      };

      const resetBotPlayer = {
        ...botPlayer,
        board: [],
        secretBoard: newBotBoard,
        ready: true,
        markedCells: new Set(),
        bingoLines: []
      };

      const nextRoundRoom = {
        ...roomData,
        currentGameIndex: (roomData.currentGameIndex || 1) + 1,
        status: 'filling',
        calledNumbers: [],
        calledHistory: [],
        currentTurnIndex: 0,
        turnOrder: [],
        players: [resetUserPlayer, resetBotPlayer],
        lastActivity: Date.now()
      };

      setRoomData(nextRoundRoom);
      syncBotSession(nextRoundRoom);
      navigate('/board-setup');
      if (cb) cb({ success: true });
      return;
    }

    // Multiplayer
    if (!socket) return;
    setGameOver(null);
    socket.emit('game:replay', {}, (res) => {
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, navigate, socket]);

  // -------------------------------------------------------------
  // LEAVE ROOM
  // -------------------------------------------------------------
  const requestLeaveRoom = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  const leaveRoom = useCallback((force = false) => {
    if (socket && !roomData?.isBot) {
      socket.emit('room:leave');
    }
    clearTimeout(botTurnTimerRef.current);
    clearTimeout(botInactivityTimerRef.current);
    clearTimeout(botInactivityWarningTimerRef.current);
    botSecretBoardRef.current = null;
    clearSession();

    // Clean up room-specific setup cache and all bot match setup keys
    try {
      if (roomData?.id) {
        const stableName = playerName || '';
        localStorage.removeItem(`bingo_setup_${roomData.id}_${stableName}`);
        localStorage.removeItem(`bingo_setup_${roomData.id}_${playerId}`);
      }
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('bingo_setup_BOT')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}

    setRoomData(null);
    setPlayerId('');
    const persistent = getPersistentPlayerNameSync();
    setPlayerName(persistent || '');
    setGameOver(null);
    setShowLeaveModal(false);
    setInactivityWarning(null);
    navigate('/lobby');
  }, [navigate, socket, roomData?.isBot, roomData?.id, playerName, playerId]);

  const transferCreator = useCallback((targetId, cb) => {
    if (!socket || roomData?.isBot) {
      if (cb) cb({ success: false, error: 'Cannot transfer privileges in a bot game.' });
      return;
    }
    socket.emit('room:transferCreator', { targetId }, (res) => {
      if (cb) cb(res);
    });
  }, [socket, roomData?.isBot]);

  // -------------------------------------------------------------
  // INACTIVITY MONITORING (Multiplayer + Bot)
  // -------------------------------------------------------------
  const keepRoomAlive = useCallback(() => {
    if (roomData?.isBot) {
      clearTimeout(botInactivityWarningTimerRef.current);
      botInactivityWarningTimerRef.current = null;
      setInactivityWarning(null);
      lastUserActivityRef.current = Date.now();
      showNotif('You kept the match active.', 'success', 2500);
      return;
    }
    if (socket) socket.emit('room:keepAlive');
    setInactivityWarning(null);
    showNotif('You kept the room active.', 'success', 2500);
  }, [socket, showNotif, roomData?.isBot]);

  const deleteRoomNow = useCallback(() => {
    if (roomData?.isBot) {
      setInactivityWarning(null);
      leaveRoom();
      return;
    }
    if (socket) socket.emit('room:deleteNow');
    setInactivityWarning(null);
    leaveRoom();
  }, [socket, leaveRoom, roomData?.isBot]);

  // Activity listeners & Inactivity detection
  useEffect(() => {
    if (!roomData) return;

    let lastSent = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      lastUserActivityRef.current = now;

      // In multiplayer: throttle activity pings to once every 15s
      if (socket && !roomData.isBot && now - lastSent >= 15000) {
        lastSent = now;
        socket.emit('room:activity');
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Bot mode local inactivity interval check
    let botInterval = null;
    if (roomData.isBot) {
      botInterval = setInterval(() => {
        const now = Date.now();
        const idleTime = now - lastUserActivityRef.current;
        // 90 seconds threshold
        if (idleTime >= 90 * 1000 && !botInactivityWarningTimerRef.current && !inactivityWarning) {
          setInactivityWarning({ countdown: 10, isSolo: true, totalPlayers: 1 });
          
          botInactivityWarningTimerRef.current = setTimeout(() => {
            setInactivityWarning(null);
            leaveRoom();
            showNotif('Match was closed due to inactivity.', 'warning', 5000);
          }, 10000);
        }
      }, 4000);
    }

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (botInterval) clearInterval(botInterval);
    };
  }, [socket, roomData, inactivityWarning, leaveRoom, showNotif]);

  const effectivePlayerId = roomData?.isBot ? (playerId || 'player-user') : playerId;
  const myPlayer = roomData?.players?.find(p => p.id === effectivePlayerId) || null;
  const isCreator = roomData?.isBot ? true : roomData?.creatorId === effectivePlayerId;
  const isMyTurn = Boolean(
    roomData?.status === 'playing' &&
    roomData?.turnOrder &&
    roomData?.turnOrder[roomData?.currentTurnIndex] &&
    roomData?.turnOrder[roomData?.currentTurnIndex] === effectivePlayerId
  );

  return (
    <GameContext.Provider value={{
      playerName, setPlayerName,
      roomData, playerId, myPlayer, isCreator, isMyTurn,
      notification, showNotif,
      gameOver, setGameOver,
      createRoom, joinRoom, startBotGame, submitBoard, startGame, callNumber, replayGame, 
      leaveRoom: requestLeaveRoom,
      actualLeaveRoom: leaveRoom,
      transferCreator,
      showLeaveModal, setShowLeaveModal,
      shareModalData, setShareModalData,
      inactivityWarning, keepRoomAlive, deleteRoomNow
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
