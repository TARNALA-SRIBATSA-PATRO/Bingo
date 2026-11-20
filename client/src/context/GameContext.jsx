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
import { trackBotGame, trackPushConversion } from '../services/analytics';

const GameContext = createContext(null);

// Session storage helpers (cleared on tab/window close, persists on refresh)
const SESSION_KEY = 'bingo_session';
const ACK_TIMEOUT_MS = 6000;
// A rejoin waits longer: right after a deploy the server may still be loading its store.
const REJOIN_TIMEOUT_MS = 15000;
const ROOM_SCREENS = ['/game', '/board-setup'];

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadSession() {
  try { const d = localStorage.getItem(SESSION_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
function hasMultiplayerSession() {
  const s = loadSession();
  return Boolean(s && s.roomId && s.playerId && !s.isBot);
}

// Emit with an acknowledgement, answering locally when the server does not answer in time.
function emitWithAck(socket, event, payload, cb, timeoutMs = ACK_TIMEOUT_MS) {
  let done = false;
  const timer = setTimeout(() => {
    if (done) return;
    done = true;
    cb({ success: false, error: 'The connection timed out. Check your connection and try again.', timedOut: true });
  }, timeoutMs);
  socket.emit(event, payload, (res) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    cb(res || { success: false, error: 'No answer from the server.' });
  });
}

// A player who comes back to a finished round has no result on screen; rebuild it from the room.
function gameOverFromRoom(room) {
  const history = room?.gameHistory || [];
  const last = history[history.length - 1];
  if (!last || last.gameIndex !== room.currentGameIndex) return null;
  return { winners: last.winners || [], gameHistory: history, draw: Boolean(last.draw) };
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
  // True while a saved multiplayer session is being re-attached, so the room screens wait instead
  // of sending the player to the lobby before the room arrives.
  const [sessionPending, setSessionPending] = useState(() => hasMultiplayerSession());

  const notifTimer = useRef(null);
  const botSecretBoardRef = useRef(null);
  const botTurnTimerRef = useRef(null);
  const botInactivityTimerRef = useRef(null);
  const botInactivityWarningTimerRef = useRef(null);
  const lastUserActivityRef = useRef(Date.now());
  const lastActivitySentRef = useRef(0);
  // react-router hands out a new navigate on every location change; handlers read it through this
  // ref so socket subscriptions are not torn down and re-created on each navigation.
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  // The room the player is in right now and the newest room:update version applied for it.
  const roomRef = useRef({ id: null, version: -1, creatorId: null, isBot: false });
  useEffect(() => {
    roomRef.current.id = roomData?.id || null;
    roomRef.current.isBot = Boolean(roomData?.isBot);
  }, [roomData?.id, roomData?.isBot]);
  const myIdRef = useRef('');
  useEffect(() => { myIdRef.current = playerId; }, [playerId]);

  const showNotif = useCallback((msg, type = 'info', duration = 3500) => {
    setNotification({ msg, type });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), duration);
  }, []);

  // Forget the current room on this client: session, room state, result, modals.
  const resetRoomState = useCallback(() => {
    clearSession();
    roomRef.current = { id: null, version: -1, creatorId: null, isBot: false };
    setRoomData(null);
    setPlayerId('');
    setGameOver(null);
    setInactivityWarning(null);
    setShowLeaveModal(false);
    setSessionPending(false);
    const persistent = getPersistentPlayerNameSync();
    setPlayerName(persistent || '');
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

  // 2. Auto-rejoin on EVERY socket connect (Multiplayer only).
  // Each reconnect gives the server a new socket id, so the saved session must
  // be re-attached every time, not just on the first connect.
  useEffect(() => {
    if (!socket) return;

    const onRoomScreen = () => ROOM_SCREENS.includes(window.location.pathname);

    const doRejoin = () => {
      const session = loadSession();
      if (!session || !session.roomId || !session.playerId || session.isBot) {
        setSessionPending(false);
        return;
      }
      const cleanRoomId = session.roomId.trim().toUpperCase();
      setSessionPending(true);
      // The seat is claimed with its id and private token. A session saved by an older build has
      // no token; the server turns it down and the client tears it down below.
      emitWithAck(socket, 'room:rejoin', {
        roomId: cleanRoomId,
        playerId: session.playerId,
        token: session.token || null
      }, (res) => {
        if (res.success) {
          setPlayerId(res.playerId);
          setPlayerName(prev => prev || session.playerName || '');
          saveSession({ ...session, roomId: cleanRoomId, playerId: res.playerId, token: res.token || session.token });
          // A round that is being set up goes to board setup. A running or finished round stays on
          // the game screen, where a finished round shows its result.
          const target = res.status === 'filling' ? '/board-setup' : '/game';
          if (window.location.pathname !== target) navigateRef.current(target);
          return;
        }
        const err = res.error;
        const gone = err === 'Room not found' || err === 'Player not found in room' || res.timedOut;
        if (!gone) {
          setSessionPending(false);
          return;
        }
        const wasOnRoomScreen = onRoomScreen();
        resetRoomState();
        if (wasOnRoomScreen) {
          showNotif(err === 'Player not found in room' ? 'You are no longer in that room.' : 'That room has closed.', 'warning', 5000);
          navigateRef.current('/lobby');
        }
      }, REJOIN_TIMEOUT_MS);
    };

    socket.on('connect', doRejoin);
    if (socket.connected) doRejoin();
    else if (!hasMultiplayerSession()) setSessionPending(false);

    return () => {
      socket.off('connect', doRejoin);
    };
  }, [socket, showNotif, resetRoomState]);

  // 3. Socket event listeners for multiplayer rooms
  useEffect(() => {
    if (!socket) return;

    // Events about a room this client is not in (a seat it already gave up) are ignored.
    const forCurrentRoom = (payload) => {
      if (roomRef.current.isBot) return false;
      const id = roomRef.current.id;
      if (!id) return false;
      return !payload?.roomId || payload.roomId === id;
    };

    socket.on('room:update', (data) => {
      // Do not overwrite local offline bot match with socket updates
      if (roomRef.current.isBot) return;
      const ref = roomRef.current;
      const version = typeof data.version === 'number' ? data.version : null;
      if (ref.id === data.id && version !== null && version < ref.version) return; // older than what is on screen
      const previousCreator = ref.id === data.id ? ref.creatorId : null;
      roomRef.current = { id: data.id, version: version ?? ref.version, creatorId: data.creatorId, isBot: false };
      setRoomData(data);
      setSessionPending(false);
      if (data.status === 'finished') {
        setGameOver(prev => prev || gameOverFromRoom(data));
      } else {
        setGameOver(null);
      }
      if (previousCreator && data.creatorId && data.creatorId !== previousCreator) {
        const host = (data.players || []).find(p => p.id === data.creatorId);
        if (host) {
          const me = myIdRef.current === data.creatorId;
          showNotif(me ? 'You are now the host.' : `${host.name} is now the host.`, 'info', 4000);
        }
      }
      if (data.turnSkippedFor && data.turnSkippedFor.name) {
        const me = myIdRef.current === data.turnSkippedFor.id;
        showNotif(me ? 'You missed a turn while you were away.' : `${data.turnSkippedFor.name} missed a turn.`, 'warning', 4000);
      }
    });

    socket.on('game:started', (payload) => {
      if (!forCurrentRoom(payload)) return;
      navigateRef.current('/game');
    });

    socket.on('game:replaying', (payload) => {
      if (!forCurrentRoom(payload)) return;
      setGameOver(null);
      navigateRef.current('/board-setup');
    });

    socket.on('game:over', (payload) => {
      if (!forCurrentRoom(payload)) return;
      const { winners, gameHistory, draw } = payload;
      setGameOver({ winners, gameHistory, draw: Boolean(draw) });
      trackPushConversion();
    });

    socket.on('player:left', (payload) => {
      if (!forCurrentRoom(payload)) return;
      showNotif(`${payload.name} left the room`, 'warning');
    });

    socket.on('room:inactivityWarning', (payload) => {
      if (!forCurrentRoom(payload)) return;
      setInactivityWarning(payload || { countdown: 10, isSolo: false });
    });

    socket.on('room:inactivityCancelled', (payload) => {
      if (!forCurrentRoom(payload)) return;
      setInactivityWarning(null);
      if (payload?.savedBy) {
        showNotif(`${payload.savedBy} kept the room active.`, 'success', 3000);
      }
    });

    const handleRoomClosed = (payload) => {
      if (!forCurrentRoom(payload)) return;
      resetRoomState();
      showNotif(payload?.message || 'Room was closed.', 'warning', 5000);
      navigateRef.current('/lobby');
    };

    socket.on('room:deletedForInactivity', handleRoomClosed);
    socket.on('room:destroyed', handleRoomClosed);

    // A short notice from the admin console to everyone in this room.
    socket.on('room:notice', ({ roomId, text } = {}) => {
      const id = roomRef.current.id;
      if (!roomRef.current.isBot && id && roomId === id && text) showNotif(text, 'info', 6000);
    });

    return () => {
      socket.off('room:update');
      socket.off('room:notice');
      socket.off('game:started');
      socket.off('game:replaying');
      socket.off('game:over');
      socket.off('player:left');
      socket.off('room:inactivityWarning');
      socket.off('room:inactivityCancelled');
      socket.off('room:deletedForInactivity', handleRoomClosed);
      socket.off('room:destroyed', handleRoomClosed);
    };
  }, [socket, showNotif, resetRoomState]);

  // Give up the current multiplayer seat before starting something else, so a room is never left
  // with a ghost player that is connected but never ready.
  const releaseMultiplayerSeat = useCallback(() => {
    if (socket && hasMultiplayerSession()) socket.emit('room:leave');
    clearSession();
    roomRef.current = { id: null, version: -1, creatorId: null, isBot: false };
    setSessionPending(false);
  }, [socket]);

  // Bot mode: everything runs locally.
  const startBotGame = useCallback((name, difficulty = 'pro', cb) => {
    const cleanName = (name || '').trim();
    const myId = 'player-user';
    const botId = 'bot-opponent';

    releaseMultiplayerSeat();

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
  }, [navigate, releaseMultiplayerSeat]);

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

  // Multiplayer: create and join rooms.
  const createRoom = useCallback((name, cb) => {
    const cleanName = (name || '').trim();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (cb) cb({
        success: false,
        error: 'You are offline. Making a room needs a connection. You can still play against the bot.'
      });
      return;
    }

    if (!socket || !socket.connected) {
      if (cb) cb({
        success: false,
        error: 'Could not reach the game server. Check your connection and try again.'
      });
      return;
    }

    releaseMultiplayerSeat();
    emitWithAck(socket, 'room:create', { name: cleanName }, (res) => {
      if (res.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        setGameOver(null);
        saveSession({ playerName: cleanName, playerId: res.playerId, token: res.token, roomId: res.roomId, isBot: false });
        // The room itself arrives in the next frame; the setup screen waits for it.
        setSessionPending(true);
        navigate('/board-setup');
      }
      if (cb) cb(res);
    });
  }, [socket, navigate, releaseMultiplayerSeat]);

  const joinRoom = useCallback((name, roomId, cb) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const cleanName = (name || '').trim();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (cb) cb({
        success: false,
        error: 'You are offline. Joining a room needs a connection. You can still play against the bot.'
      });
      return;
    }

    if (!socket || !socket.connected) {
      if (cb) cb({
        success: false,
        error: 'Could not reach the game server. Check your connection and try again.'
      });
      return;
    }

    releaseMultiplayerSeat();
    emitWithAck(socket, 'room:join', { name: cleanName, roomId: cleanRoomId }, (res) => {
      if (res.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        setGameOver(null);
        saveSession({ playerName: cleanName, playerId: res.playerId, token: res.token, roomId: cleanRoomId, isBot: false });
        setSessionPending(true);
        // Taking a seat back in a running or finished round lands on the game screen.
        navigate(res.status && res.status !== 'filling' ? '/game' : '/board-setup');
      }
      if (cb) cb(res);
    });
  }, [socket, navigate, releaseMultiplayerSeat]);

  // Game actions are not queued while the connection is down; the player is asked to try again
  // once it is back, instead of a buffered action arriving under a new socket id.
  const offlineReply = (cb) => {
    if (cb) cb({ success: false, error: 'Reconnecting. Try again in a moment.' });
  };

  // Submit the card.
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
        if (lastGame?.winners?.length > 0 && !lastGame.draw && lastGame.winners.length === 1) {
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
        matchStartTime: Date.now(),
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
    if (!socket.connected) return offlineReply(cb);
    emitWithAck(socket, 'board:submit', { board }, (res) => {
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, navigate, socket]);

  const startGame = useCallback((cb) => {
    if (roomData?.isBot) {
      if (cb) cb({ success: true });
      return;
    }
    if (!socket) return;
    if (!socket.connected) return offlineReply(cb);
    emitWithAck(socket, 'game:start', {}, (res) => {
      if (cb) cb(res);
    });
  }, [roomData?.isBot, socket]);

  // Call a number (player or bot).
  const callNumber = useCallback((number, cb, isBotCall = false) => {
    if (roomData?.isBot) {
      if (roomData.status !== 'playing') {
        if (cb) cb({ success: false, error: 'The game is not in progress.' });
        return;
      }

      const currentTurnPlayerId = roomData.turnOrder?.[roomData.currentTurnIndex];
      const effectivePlayerId = playerId || 'player-user';

      // Turn Validation Guard: Only allow moves during the caller's legitimate turn
      if (!isBotCall && currentTurnPlayerId !== effectivePlayerId) {
        if (cb) cb({ success: false, error: 'It is not your turn. Wait for the bot to call a number.' });
        return;
      }
      if (isBotCall && currentTurnPlayerId !== 'bot-opponent') {
        if (cb) cb({ success: false, error: 'Bot move ignored (not bot turn)' });
        return;
      }

      const num = parseInt(number, 10);
      if (roomData.calledNumbers.includes(num)) {
        if (cb) cb({ success: false, error: 'That number was already called.' });
        return;
      }
      if (isNaN(num) || num < 1 || num > 25) {
        if (cb) cb({ success: false, error: 'That number is not valid.' });
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
      // Both reaching five lines on the same call is a draw: no wins awarded
      const draw = userCompletedLines.length >= 5 && botCompletedLines.length >= 5;
      if (userCompletedLines.length >= 5) {
        if (!draw) updatedUserPlayer.wins = (updatedUserPlayer.wins || 0) + 1;
        winners.push({
          id: updatedUserPlayer.id,
          name: updatedUserPlayer.name,
          wins: updatedUserPlayer.wins || 0
        });
      }

      if (botCompletedLines.length >= 5) {
        if (!draw) updatedBotPlayer.wins = (updatedBotPlayer.wins || 0) + 1;
        winners.push({
          id: updatedBotPlayer.id,
          name: updatedBotPlayer.name,
          wins: updatedBotPlayer.wins || 0
        });
      }

      if (winners.length > 0) {
        // MATCH OVER!
        const userWon = winners.some(w => w.id === effectivePlayerId);
        const botWon = winners.some(w => w.id === 'bot-opponent');
        let winnerResult = 'tie';
        if (userWon && !botWon) winnerResult = 'user';
        else if (botWon && !userWon) winnerResult = 'bot';

        const durationMs = roomData.matchStartTime ? (Date.now() - roomData.matchStartTime) : null;

        trackBotGame({
          difficulty: roomData.difficulty || 'pro',
          winner: winnerResult,
          durationMs
        });
        trackPushConversion();

        const gameHistoryEntry = {
          gameIndex: roomData.currentGameIndex,
          winners: winners.map(w => ({ name: w.name, id: w.id })),
          ...(draw ? { draw: true } : {})
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
          draw,
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
    if (!socket.connected) return offlineReply(cb);
    emitWithAck(socket, 'game:callNumber', { number }, (res) => {
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, socket]);

  // The bot takes its turn automatically.
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

  // Replay the game.
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

    // Multiplayer. The round being finished goes along so a repeated tap cannot skip a round.
    if (!socket) return;
    if (!socket.connected) return offlineReply(cb);
    emitWithAck(socket, 'game:replay', { gameIndex: roomData?.currentGameIndex }, (res) => {
      if (res.success) setGameOver(null);
      if (cb) cb(res);
    });
  }, [roomData, playerId, syncBotSession, navigate, socket]);

  // Leave the room.
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

    resetRoomState();
    navigate('/lobby');
  }, [navigate, socket, roomData?.isBot, roomData?.id, playerName, playerId, resetRoomState]);

  const transferCreator = useCallback((targetId, cb) => {
    if (!socket || roomData?.isBot) {
      if (cb) cb({ success: false, error: 'The host cannot be changed in a bot game.' });
      return;
    }
    if (!socket.connected) return offlineReply(cb);
    emitWithAck(socket, 'room:transferCreator', { targetId }, (res) => {
      if (cb) cb(res);
    });
  }, [socket, roomData?.isBot]);

  // Inactivity monitoring (multiplayer and bot).
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

  const isCreator = roomData?.isBot ? true : roomData?.creatorId === playerId;

  // Only the host can close the room for everyone; anyone else just leaves it.
  const deleteRoomNow = useCallback(() => {
    setInactivityWarning(null);
    if (!roomData?.isBot && isCreator && socket) socket.emit('room:deleteNow');
    leaveRoom();
  }, [socket, leaveRoom, roomData?.isBot, isCreator]);

  // Activity listeners: in multiplayer the server hears from the player at most every 15 s.
  useEffect(() => {
    if (!roomData?.id) return;
    const isBot = Boolean(roomData.isBot);

    const handleUserActivity = () => {
      const now = Date.now();
      lastUserActivityRef.current = now;
      if (socket && !isBot && now - lastActivitySentRef.current >= 15000) {
        lastActivitySentRef.current = now;
        socket.emit('room:activity');
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [socket, roomData?.id, roomData?.isBot]);

  // Bot mode local inactivity check
  useEffect(() => {
    if (!roomData?.isBot) return;
    const botInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastUserActivityRef.current;
      // 90 seconds threshold
      if (idleTime >= 90 * 1000 && !botInactivityWarningTimerRef.current && !inactivityWarning) {
        setInactivityWarning({ countdown: 10, isSolo: true, totalPlayers: 1 });

        botInactivityWarningTimerRef.current = setTimeout(() => {
          setInactivityWarning(null);
          leaveRoom();
          showNotif('The match was closed after a long pause.', 'warning', 5000);
        }, 10000);
      }
    }, 4000);

    return () => clearInterval(botInterval);
  }, [roomData?.isBot, inactivityWarning, leaveRoom, showNotif]);

  const effectivePlayerId = roomData?.isBot ? (playerId || 'player-user') : playerId;
  const myPlayer = roomData?.players?.find(p => p.id === effectivePlayerId) || null;
  const isMyTurn = Boolean(
    roomData?.status === 'playing' &&
    roomData?.turnOrder &&
    roomData?.turnOrder[roomData?.currentTurnIndex] &&
    roomData?.turnOrder[roomData?.currentTurnIndex] === effectivePlayerId
  );

  return (
    <GameContext.Provider value={{
      playerName, setPlayerName,
      roomData, playerId, myPlayer, isCreator, isMyTurn, sessionPending,
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
