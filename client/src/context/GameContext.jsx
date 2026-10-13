import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import { 
  getPersistentPlayerName, 
  getPersistentPlayerNameSync, 
  setPersistentPlayerName 
} from '../utils/storageUtils';

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
  const notifTimer = useRef(null);

  // Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setPlayerName(session.playerName || '');
      setPlayerId(session.playerId || '');
    } else {
      getPersistentPlayerName().then(saved => {
        if (saved) setPlayerName(saved);
      });
    }
  }, []);

  // Auto-rejoin on socket connect
  useEffect(() => {
    if (!socket) return;
    const session = loadSession();
    if (session && session.roomId && session.playerName && session.playerId) {
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

  const showNotif = useCallback((msg, type = 'info', duration = 3500) => {
    setNotification({ msg, type });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), duration);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('room:update', (data) => {
      setRoomData(data);
      // Fallback: if the room resets to filling (new game), clear any stale game-over modal
      if (data.status === 'filling') {
        setGameOver(null);
      }
    });

    socket.on('game:started', () => {
      navigate('/game');
    });

    socket.on('game:replaying', () => {
      // Clear the game-over modal immediately for ALL players (not just creator)
      setGameOver(null);
      navigate('/board-setup');
    });

    socket.on('game:over', ({ winners, gameHistory }) => {
      setGameOver({ winners, gameHistory });
    });

    socket.on('player:left', ({ name }) => {
      showNotif(`${name} left the room`, 'warning');
    });

    socket.on('room:inactivityWarning', (payload) => {
      setInactivityWarning(payload || { countdown: 10, isSolo: false });
    });

    socket.on('room:inactivityCancelled', ({ savedBy } = {}) => {
      setInactivityWarning(null);
      if (savedBy) {
        showNotif(`${savedBy} kept the room active.`, 'success', 3000);
      }
    });

    socket.on('room:deletedForInactivity', ({ message }) => {
      setInactivityWarning(null);
      clearSession();
      setRoomData(null);
      setPlayerId('');
      setGameOver(null);
      showNotif(message || 'Room was closed due to inactivity.', 'warning', 5000);
      navigate('/');
    });

    return () => {
      socket.off('room:update');
      socket.off('game:started');
      socket.off('game:replaying');
      socket.off('game:over');
      socket.off('player:left');
      socket.off('room:inactivityWarning');
      socket.off('room:inactivityCancelled');
      socket.off('room:deletedForInactivity');
    };
  }, [socket, navigate, showNotif]);

  const createRoom = useCallback((name, cb) => {
    if (!socket) return;
    const cleanName = (name || '').trim();
    socket.emit('room:create', { name: cleanName }, (res) => {
      if (res.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        saveSession({ playerName: cleanName, playerId: res.playerId, roomId: res.roomId });
        navigate('/board-setup');
      }
      cb(res);
    });
  }, [socket, navigate]);

  const joinRoom = useCallback((name, roomId, cb) => {
    if (!socket) return;
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const cleanName = (name || '').trim();
    socket.emit('room:join', { name: cleanName, roomId: cleanRoomId }, (res) => {
      if (res.success) {
        setPlayerName(cleanName);
        setPersistentPlayerName(cleanName);
        setPlayerId(res.playerId);
        saveSession({ playerName: cleanName, playerId: res.playerId, roomId: cleanRoomId });
        navigate('/board-setup');
      }
      cb(res);
    });
  }, [socket, navigate]);

  const submitBoard = useCallback((board, cb) => {
    if (!socket) return;
    socket.emit('board:submit', { board }, (res) => {
      if (cb) cb(res);
    });
  }, [socket]);

  const startGame = useCallback((cb) => {
    if (!socket) return;
    socket.emit('game:start', {}, (res) => {
      if (cb) cb(res);
    });
  }, [socket]);

  const callNumber = useCallback((number, cb) => {
    if (!socket) return;
    socket.emit('game:callNumber', { number }, (res) => {
      if (cb) cb(res);
    });
  }, [socket]);

  const replayGame = useCallback((cb) => {
    if (!socket) return;
    setGameOver(null);
    socket.emit('game:replay', {}, (res) => {
      if (cb) cb(res);
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    
    // existing socket.on bindings are higher up in a different useEffect, let's just add one more
    const handleRoomDestroyed = ({ message }) => {
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
    return () => socket.off('room:destroyed', handleRoomDestroyed);
  }, [socket, navigate, showNotif]);

  const transferCreator = useCallback((targetId, cb) => {
    if (!socket) return;
    socket.emit('room:transferCreator', { targetId }, (res) => {
      if (cb) cb(res);
    });
  }, [socket]);

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const requestLeaveRoom = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  const leaveRoom = useCallback((force = false) => {
    if (socket) socket.emit('room:leave');
    clearSession();
    setRoomData(null);
    setPlayerId('');
    const persistent = getPersistentPlayerNameSync();
    setPlayerName(persistent || '');
    setGameOver(null);
    setShowLeaveModal(false);
    navigate('/');
  }, [navigate, socket]);

  const keepRoomAlive = useCallback(() => {
    if (socket) socket.emit('room:keepAlive');
    setInactivityWarning(null);
    showNotif('You kept the room active.', 'success', 2500);
  }, [socket, showNotif]);

  const deleteRoomNow = useCallback(() => {
    if (socket) socket.emit('room:deleteNow');
    setInactivityWarning(null);
    leaveRoom();
  }, [socket, leaveRoom]);

  // Activity heartbeat for all players while in a room
  useEffect(() => {
    if (!socket || !roomData) return;

    let lastSent = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity pings to once every 15 seconds
      if (now - lastSent >= 15000) {
        lastSent = now;
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
  }, [socket, roomData]);

  const myPlayer = roomData?.players?.find(p => p.id === playerId) || null;
  const isCreator = roomData?.creatorId === playerId;
  const isMyTurn = roomData?.turnOrder?.[roomData?.currentTurnIndex] === playerId;

  return (
    <GameContext.Provider value={{
      playerName, setPlayerName,
      roomData, playerId, myPlayer, isCreator, isMyTurn,
      notification, showNotif,
      gameOver, setGameOver,
      createRoom, joinRoom, submitBoard, startGame, callNumber, replayGame, 
      leaveRoom: requestLeaveRoom, // Point legacy callers to modal 
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
