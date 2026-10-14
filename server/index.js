import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  recordHeartbeat,
  recordInstall,
  recordBotGame,
  syncOfflineEvents,
  recordMultiplayerRoomCreated,
  recordMultiplayerGameCompleted,
  savePushSubscription,
  getVapidPublicKey,
  getAdminDashboardStats,
  sendBroadcastPushNotification,
  getNotificationsHistory,
  restoreBackupData,
  getBackupPayload,
  schedulePushNotification,
  getScheduledNotifications,
  cancelScheduledNotification,
  updateScheduledNotification,
  excludeAdminUser,
  recordPushPrompt,
  recordPushClick,
  recordPushConvert,
  getSchedulingNotices,
  getAiAutoPilotConfig,
  updateAiAutoPilotConfig,
  getSentTodayAndRecent,
  generateSmartNotificationCampaign
} from './analyticsStore.js';
import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminChangePassword,
  handleAdminSessionCheck,
  requireAdminAuth,
  verifyAdminToken,
  ADMIN_PATH
} from './adminAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env file if present in server/ or project root
for (const envCandidate of [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env')
]) {
  try {
    if (fs.existsSync(envCandidate)) {
      const rawEnv = fs.readFileSync(envCandidate, 'utf8');
      rawEnv.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
      });
      break;
    }
  } catch (e) {
    // ignore
  }
}

const CURRENT_VERSION = '2.5.6';
const VERSION_PAYLOAD = JSON.stringify({
  version: CURRENT_VERSION,
  buildTime: Date.now()
});

const app = express();
app.disable('x-powered-by');

// Enforce strict security headers (Anti-sniffing, Anti-clickjacking, HSTS, Referrer Policy)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// Enable Gzip/Deflate compression for all HTTP responses (reduces bandwidth by ~70%)
app.use(compression({
  threshold: 1024,
  level: 6
}));

// Parse JSON request bodies for analytics & admin APIs
app.use(express.json({ limit: '256kb' }));

// Fast in-memory endpoint for version checks (bypasses disk reads and file stat calls)
app.get(['/version.json', '/api/version'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(VERSION_PAYLOAD);
});

// Static assets with aggressive caching for hashed files and zero-cache for critical files
app.use(express.static(path.join(__dirname, '../client/dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (
      filePath.endsWith('sw.js') ||
      filePath.endsWith('version.json') ||
      filePath.endsWith('index.html')
    ) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.use(cors());

const httpServer = createServer(app);

// Align with Render's reverse-proxy timeouts to eliminate 502 Bad Gateway race conditions
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

// High-performance Socket.IO configuration optimized for 500+ users on Render free tier (512MB RAM)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // CRITICAL: Disabling perMessageDeflate eliminates per-connection zlib stream allocations,
  // saving ~150MB of RAM and removing CPU compression bottlenecks for tiny JSON messages.
  perMessageDeflate: false,
  httpCompression: false,
  maxHttpBufferSize: 64 * 1024, // 64KB max packet size prevents memory exhaustion
  pingInterval: 25000,
  pingTimeout: 20000,
  cleanupEmptyChildNamespaces: true
});

// Protect single-threaded Node.js event loop from packet flood / spam
const socketRateMap = new Map();
io.use((socket, next) => {
  socketRateMap.set(socket.id, { count: 0, resetTime: Date.now() });

  socket.use((packet, packetNext) => {
    const rate = socketRateMap.get(socket.id);
    const now = Date.now();
    if (!rate || now - rate.resetTime >= 1000) {
      if (rate) {
        rate.count = 1;
        rate.resetTime = now;
      }
      return packetNext();
    }
    rate.count++;
    if (rate.count > 30) {
      // Drop excess packets if client exceeds 30 packets/sec
      return;
    }
    packetNext();
  });

  socket.on('disconnect', () => {
    socketRateMap.delete(socket.id);
  });

  next();
});

// rooms: { [roomId]: Room }
const rooms = {};

// Clean up room and cancel all associated timers to prevent memory leaks
function cleanupRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.deletionTimer) {
    clearTimeout(room.deletionTimer);
    room.deletionTimer = null;
  }

  if (room.players) {
    for (const player of Object.values(room.players)) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
    }
  }

  delete rooms[roomId];
}

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Fisher-Yates array shuffle for fair randomized turn order
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Find the winner from the last game in the room (if they are still active in the room)
function getLastWinnerPlayer(room) {
  if (!room.gameHistory || room.gameHistory.length === 0) return null;
  const lastGame = room.gameHistory[room.gameHistory.length - 1];
  if (!lastGame || !Array.isArray(lastGame.winners) || lastGame.winners.length === 0) return null;

  const validWinners = [];
  for (const w of lastGame.winners) {
    if (w.id && room.players[w.id]) {
      validWinners.push(room.players[w.id]);
    } else if (w.name) {
      const found = Object.values(room.players).find(p => p.name === w.name);
      if (found) validWinners.push(found);
    }
  }

  if (validWinners.length === 0) return null;
  // If multiple tied winners, pick randomly among the tied winners
  return validWinners[Math.floor(Math.random() * validWinners.length)];
}

// Optimized personalized broadcast: prepares shared data once per room broadcast
function broadcastRoom(room) {
  if (!room || !room.players) return;

  const basePlayers = Object.values(room.players).map(p => ({
    id: p.id,
    name: p.name,
    ready: p.ready,
    markedCells: Array.from(p.markedCells || []),
    bingoLines: Array.from(p.bingoLines || []),
    wins: p.wins || 0,
    _rawBoard: p.board || []
  }));

  const baseData = {
    id: room.id,
    creatorId: room.creatorId,
    status: room.status,
    leftPlayers: room.leftPlayers || {},
    currentTurnIndex: room.currentTurnIndex,
    calledNumbers: room.calledNumbers || [],
    calledHistory: room.calledHistory || [],
    turnOrder: room.turnOrder || [],
    gameHistory: room.gameHistory || [],
    currentGameIndex: room.currentGameIndex
  };

  for (const socketId of Object.keys(room.players)) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      const players = basePlayers.map(p => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        board: p.id === socketId ? p._rawBoard : [],
        markedCells: p.markedCells,
        bingoLines: p.bingoLines,
        wins: p.wins
      }));
      targetSocket.emit('room:update', { ...baseData, players });
    }
  }
}

function checkBingo(board, markedSet) {
  if (!Array.isArray(board) || board.length !== 5 || !Array.isArray(board[0])) return [];
  const lines = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    let complete = true;
    for (let c = 0; c < 5; c++) {
      const val = board[r][c];
      if (!markedSet.has(val)) {
        complete = false;
        break;
      }
    }
    if (complete) lines.push(`row-${r}`);
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    let complete = true;
    for (let r = 0; r < 5; r++) {
      const val = board[r][c];
      if (!markedSet.has(val)) {
        complete = false;
        break;
      }
    }
    if (complete) lines.push(`col-${c}`);
  }

  // Diagonals
  let d1 = true, d2 = true;
  for (let i = 0; i < 5; i++) {
    if (!markedSet.has(board[i][i])) d1 = false;
    if (!markedSet.has(board[i][4 - i])) d2 = false;
  }
  if (d1) lines.push('diag-main');
  if (d2) lines.push('diag-anti');

  return lines;
}

function checkSinglePlayerWin(room, ioInstance) {
  if (room.status === 'playing' && Object.keys(room.players).length === 1) {
    const lastPlayerId = Object.keys(room.players)[0];
    const lastPlayer = room.players[lastPlayerId];

    room.status = 'finished';
    lastPlayer.wins = (lastPlayer.wins || 0) + 1;
    room.gameHistory.push({
      gameIndex: room.currentGameIndex,
      winners: [{ name: lastPlayer.name, id: lastPlayer.id }]
    });

    const durationMs = room.matchStartTime ? (Date.now() - room.matchStartTime) : null;
    recordMultiplayerGameCompleted({ durationMs, playerCount: 2 });

    broadcastRoom(room);
    ioInstance.to(room.id).emit('game:over', {
      winners: [{ name: lastPlayer.name, id: lastPlayer.id, wins: lastPlayer.wins }],
      gameHistory: room.gameHistory
    });
  }
}

function touchRoomActivity(room, savedBy = null) {
  if (!room) return;
  room.lastActivity = Date.now();
  if (room.deletionTimer) {
    clearTimeout(room.deletionTimer);
    room.deletionTimer = null;
    io.to(room.id).emit('room:inactivityCancelled', { savedBy });
  }
}

function startRoomDeletionCountdown(room, isSolo, totalPlayers) {
  if (!room || room.deletionTimer) return;
  const roomId = room.id;

  // Emit 10-second warning countdown to all players in the room
  io.to(roomId).emit('room:inactivityWarning', {
    countdown: 10,
    isSolo,
    totalPlayers
  });

  room.deletionTimer = setTimeout(() => {
    const currentRoom = rooms[roomId];
    if (!currentRoom) return;

    io.to(roomId).emit('room:deletedForInactivity', {
      message: 'Room was closed due to inactivity.'
    });
    cleanupRoom(roomId);
  }, 10000); // 10 seconds countdown
}

// Inactivity thresholds:
// 90 seconds if player is alone, 120 seconds if all players in multiplayer room are idle
const SOLO_INACTIVITY_MS = 90 * 1000;
const MULTI_INACTIVITY_MS = 120 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of Object.entries(rooms)) {
    const activePlayers = Object.values(room.players).filter(p => p.connected !== false);

    if (activePlayers.length === 0) {
      cleanupRoom(roomId);
      continue;
    }

    if (!room.deletionTimer) {
      const idleTime = now - (room.lastActivity || now);
      const isSolo = activePlayers.length === 1;
      const threshold = isSolo ? SOLO_INACTIVITY_MS : MULTI_INACTIVITY_MS;

      if (idleTime >= threshold) {
        startRoomDeletionCountdown(room, isSolo, activePlayers.length);
      }
    }
  }
}, 5000);

io.on('connection', (socket) => {
  // Create room
  socket.on('room:create', ({ name }, cb) => {
    name = (name || '').trim();
    let roomId = generateRoomId().toUpperCase();
    let attempts = 0;
    while (rooms[roomId] && attempts < 20) {
      roomId = generateRoomId().toUpperCase();
      attempts++;
    }

    const player = {
      id: socket.id,
      name,
      board: [],
      markedCells: new Set(),
      bingoLines: new Set(),
      ready: false,
      wins: 0
    };

    rooms[roomId] = {
      id: roomId,
      creatorId: socket.id,
      players: { [socket.id]: player },
      status: 'filling',
      currentTurnIndex: 0,
      calledNumbers: [],
      calledHistory: [], // [{number, calledById}]
      turnOrder: [],
      gameHistory: [],
      leftPlayers: {},
      currentGameIndex: 1,
      lastActivity: Date.now(),
      deletionTimer: null
    };

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;

    cb({ success: true, roomId, playerId: socket.id });
    broadcastRoom(rooms[roomId]);
    recordMultiplayerRoomCreated();
  });

  // Join room
  socket.on('room:join', ({ name, roomId }, cb) => {
    name = (name || '').trim();
    roomId = (roomId || '').trim().toUpperCase();
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.status === 'playing') return cb({ success: false, error: 'Game already in progress' });

    // Max players limit (4 players per room)
    if (Object.keys(room.players).length >= 4) {
      return cb({ success: false, error: 'Room is full (max 4 players)' });
    }

    // Check duplicate name
    const existingNames = [
      ...Object.values(room.players).map(p => p.name.toLowerCase()),
      ...Object.values(room.leftPlayers || {}).map(p => p.name.toLowerCase())
    ];
    if (existingNames.includes(name.toLowerCase())) {
      return cb({ success: false, error: 'Name already taken in this room' });
    }

    const player = {
      id: socket.id,
      name,
      board: [],
      markedCells: new Set(),
      bingoLines: new Set(),
      ready: false,
      wins: 0
    };

    room.players[socket.id] = player;
    touchRoomActivity(room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;

    cb({ success: true, roomId, playerId: socket.id });
    broadcastRoom(room);
  });

  // Player submits board
  socket.on('board:submit', ({ board }, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });

    touchRoomActivity(room);
    const player = room.players[socket.id];
    if (!player) return cb({ success: false, error: 'Player not found' });

    // Validate board: 5x5, unique numbers 1-25
    if (!Array.isArray(board) || board.length !== 5) return cb({ success: false, error: 'Invalid board' });
    const flat = board.flat();
    if (flat.length !== 25) return cb({ success: false, error: 'Invalid board size' });
    const unique = new Set(flat);
    if (unique.size !== 25) return cb({ success: false, error: 'Duplicate numbers found' });
    for (const n of flat) {
      if (!Number.isInteger(n) || n < 1 || n > 25) return cb({ success: false, error: 'Numbers must be 1-25' });
    }

    player.board = board;
    player.ready = true;
    player.markedCells = new Set();
    player.bingoLines = new Set();

    cb({ success: true });
    broadcastRoom(room);
  });

  // Start game (creator only)
  socket.on('game:start', (_, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.creatorId !== socket.id) return cb({ success: false, error: 'Only creator can start' });

    touchRoomActivity(room);
    const players = Object.values(room.players);
    if (players.length < 2) return cb({ success: false, error: 'Need at least 2 players' });
    if (!players.every(p => p.ready)) return cb({ success: false, error: 'All players must be ready' });

    room.status = 'playing';

    // Determine turn order
    const playerIds = Object.keys(room.players);
    const lastWinner = getLastWinnerPlayer(room);

    if (lastWinner && room.players[lastWinner.id]) {
      const otherPlayers = shuffleArray(playerIds.filter(id => id !== lastWinner.id));
      room.turnOrder = [lastWinner.id, ...otherPlayers];
    } else {
      room.turnOrder = shuffleArray(playerIds);
    }

    room.currentTurnIndex = 0;
    room.calledNumbers = [];
    room.calledHistory = [];
    room.matchStartTime = Date.now();

    cb({ success: true });
    broadcastRoom(room);
    io.to(roomId).emit('game:started', { currentTurn: room.turnOrder[0] });
  });

  // Call a number (current turn player)
  socket.on('game:callNumber', ({ number }, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.status !== 'playing') return cb({ success: false, error: 'Game not in progress' });

    touchRoomActivity(room);
    const currentPlayerId = room.turnOrder[room.currentTurnIndex];
    if (socket.id !== currentPlayerId) return cb({ success: false, error: 'Not your turn' });
    if (room.calledNumbers.includes(number)) return cb({ success: false, error: 'Number already called' });
    if (number < 1 || number > 25) return cb({ success: false, error: 'Invalid number' });

    room.calledNumbers.push(number);
    room.calledHistory.push({ number, calledById: socket.id });

    // Mark number for all players and check bingo
    const winners = [];
    for (const player of Object.values(room.players)) {
      const flat = player.board.flat();
      if (flat.includes(number)) {
        player.markedCells.add(number);
      }

      const newLines = checkBingo(player.board, player.markedCells);
      newLines.forEach(l => player.bingoLines.add(l));

      // B-I-N-G-O: 5 lines = win
      if (player.bingoLines.size >= 5) {
        winners.push(player);
      }
    }

    if (winners.length > 0) {
      room.status = 'finished';
      winners.forEach(w => { w.wins = (w.wins || 0) + 1; });
      room.gameHistory.push({
        gameIndex: room.currentGameIndex,
        winners: winners.map(w => ({ name: w.name, id: w.id }))
      });
      // Cap game history to 20 to prevent unbounded memory growth
      if (room.gameHistory.length > 20) {
        room.gameHistory.shift();
      }

      const durationMs = room.matchStartTime ? (Date.now() - room.matchStartTime) : null;
      const playerCount = Object.keys(room.players || {}).length;
      recordMultiplayerGameCompleted({ durationMs, playerCount });

      broadcastRoom(room);
      io.to(roomId).emit('game:over', {
        winners: winners.map(w => ({ name: w.name, id: w.id, wins: w.wins })),
        gameHistory: room.gameHistory
      });
      return cb({ success: true });
    }

    // Next turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
    broadcastRoom(room);
    io.to(roomId).emit('game:numberCalled', {
      number,
      calledBy: room.players[currentPlayerId]?.name,
      nextTurn: room.turnOrder[room.currentTurnIndex]
    });

    cb({ success: true });
  });

  // Replay game (creator only)
  socket.on('game:replay', (_, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.creatorId !== socket.id) return cb({ success: false, error: 'Only creator can replay' });

    touchRoomActivity(room);
    room.currentGameIndex++;
    room.status = 'filling';
    room.calledNumbers = [];
    room.calledHistory = [];
    room.currentTurnIndex = 0;
    room.turnOrder = [];

    for (const player of Object.values(room.players)) {
      player.board = [];
      player.markedCells = new Set();
      player.bingoLines = new Set();
      player.ready = false;
    }

    cb({ success: true });
    io.to(roomId).emit('game:replaying');
    setTimeout(() => broadcastRoom(room), 80);
  });

  // Transfer Creator
  socket.on('room:transferCreator', ({ targetId }, cb) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.creatorId !== socket.id) return cb({ success: false, error: 'Only creator can transfer privilege' });
    if (!room.players[targetId]) return cb({ success: false, error: 'Target player not found' });

    touchRoomActivity(room);
    room.creatorId = targetId;
    cb({ success: true });
    broadcastRoom(room);
  });

  // Leave room explicitly
  socket.on('room:leave', (_, cb) => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms[roomId]) {
      if (cb) cb({ success: true });
      return;
    }

    const room = rooms[roomId];
    const player = room.players[socket.id];

    if (player) {
      room.leftPlayers = room.leftPlayers || {};
      room.leftPlayers[socket.id] = {
        id: player.id,
        name: player.name,
        wins: player.wins || 0
      };
    }

    if (room.creatorId === socket.id && Object.keys(room.players).length > 1) {
      io.to(roomId).emit('room:destroyed', { message: 'Creator left the room. Game over!' });
      cleanupRoom(roomId);
      if (cb) cb({ success: true });
      return;
    }

    delete room.players[socket.id];
    const idx = room.turnOrder.indexOf(socket.id);
    if (idx !== -1) {
      room.turnOrder.splice(idx, 1);
      if (room.currentTurnIndex >= room.turnOrder.length) room.currentTurnIndex = 0;
    }

    if (Object.keys(room.players).length === 0) {
      cleanupRoom(roomId);
    } else {
      if (Object.keys(room.players).length === 1) {
        touchRoomActivity(room);
      }
      checkSinglePlayerWin(room, io);
      broadcastRoom(room);
      io.to(roomId).emit('player:left', { name: socket.data.name });
    }

    socket.data.roomId = null;
    socket.leave(roomId);
    if (cb) cb({ success: true });
  });

  // Auto-rejoin
  socket.on('room:rejoin', ({ name, roomId, oldPlayerId }, cb) => {
    name = (name || '').trim();
    roomId = (roomId || '').trim().toUpperCase();
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });

    let existingPlayer = room.players[oldPlayerId] || Object.values(room.players).find(p => p.name === name);
    let wasLeft = false;
    if (!existingPlayer && room.leftPlayers) {
      existingPlayer = room.leftPlayers[oldPlayerId] || Object.values(room.leftPlayers).find(p => p.name === name);
      if (existingPlayer) wasLeft = true;
    }

    if (!existingPlayer) return cb({ success: false, error: 'Player not found in room' });

    const oldId = existingPlayer.id;
    existingPlayer.id = socket.id;
    existingPlayer.connected = true;
    if (existingPlayer.disconnectTimer) {
      clearTimeout(existingPlayer.disconnectTimer);
      delete existingPlayer.disconnectTimer;
    }

    if (wasLeft) {
      room.players[socket.id] = existingPlayer;
      delete room.leftPlayers[oldId];
      if (room.status === 'playing') {
        room.turnOrder.push(socket.id);
      }
    } else if (oldId !== socket.id) {
      room.players[socket.id] = existingPlayer;
      delete room.players[oldId];
      const idx = room.turnOrder.indexOf(oldId);
      if (idx !== -1) room.turnOrder[idx] = socket.id;
    }

    if (room.creatorId === oldId) room.creatorId = socket.id;

    touchRoomActivity(room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;

    cb({ success: true, roomId, playerId: socket.id, status: room.status });
    broadcastRoom(room);
  });

  // Player activity heartbeat from client
  socket.on('room:activity', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];
    if (!room.deletionTimer) {
      room.lastActivity = Date.now();
    }
  });

  // Player clicked "Do Not Delete" button in inactivity countdown modal
  socket.on('room:keepAlive', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];
    const player = room.players[socket.id];
    const playerName = player?.name || socket.data.name || 'A player';
    touchRoomActivity(room, playerName);
  });

  // Player explicitly chose to delete room now from inactivity modal
  socket.on('room:deleteNow', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms[roomId]) return;
    cleanupRoom(roomId);
    socket.emit('room:deletedForInactivity', {
      message: 'Room was closed.'
    });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];
    const player = room.players[socket.id];
    if (!player) return;

    player.connected = false;

    // Start a 60 second timer to remove them if they don't reconnect
    player.disconnectTimer = setTimeout(() => {
      if (!rooms[roomId] || !rooms[roomId].players[socket.id] || rooms[roomId].players[socket.id].connected) return;

      const disconnectedPlayer = room.players[socket.id];
      room.leftPlayers = room.leftPlayers || {};
      room.leftPlayers[socket.id] = {
        id: disconnectedPlayer.id,
        name: disconnectedPlayer.name,
        wins: disconnectedPlayer.wins || 0
      };

      delete room.players[socket.id];

      // Remove from turn order if playing
      const idx = room.turnOrder.indexOf(socket.id);
      if (idx !== -1) {
        room.turnOrder.splice(idx, 1);
        if (room.currentTurnIndex >= room.turnOrder.length) {
          room.currentTurnIndex = 0;
        }
      }

      // If creator left, assign new creator
      if (room.creatorId === socket.id && Object.keys(room.players).length > 0) {
        room.creatorId = Object.keys(room.players)[0];
      }

      // Clean up empty rooms
      if (Object.keys(room.players).length === 0) {
        cleanupRoom(roomId);
        return;
      }

      if (Object.keys(room.players).length === 1) {
        touchRoomActivity(room);
      }

      checkSinglePlayerWin(room, io);
      broadcastRoom(room);
      io.to(roomId).emit('player:left', { name: socket.data.name });
    }, 60000);

    broadcastRoom(room);
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Decoy / Honeypot: Reject common probing paths
app.get(['/admin', '/dashboard', '/cpanel', '/login', '/wp-admin'], (req, res) => {
  res.status(404).send('Not found');
});

// Analytics Ingestion APIs (Lightweight, rate-protected, excludes admin)
app.post('/api/analytics/heartbeat', (req, res) => {
  const { userId, isPwa, lifetimeBotStats, isAdmin } = req.body || {};
  const adminHeader = req.headers['x-admin-token'];
  // If request is from admin or contains admin session token, ignore and purge from player metrics
  if (isAdmin || (adminHeader && verifyAdminToken(adminHeader))) {
    if (userId) excludeAdminUser(userId);
    return res.json({ success: true, ignored: true });
  }
  const userAgent = req.headers['user-agent'] || '';
  recordHeartbeat({ userId, isPwa, userAgent, lifetimeBotStats });
  res.json({ success: true });
});

app.post('/api/analytics/event', (req, res) => {
  const { userId, event } = req.body || {};
  if (event === 'installed') {
    recordInstall({ userId });
  }
  res.json({ success: true });
});

app.post('/api/analytics/bot-game', (req, res) => {
  const { userId, difficulty, winner, lifetimeStats, durationMs } = req.body || {};
  recordBotGame({ userId, difficulty, winner, lifetimeStats, durationMs });
  res.json({ success: true });
});

app.post('/api/analytics/push-click', (req, res) => {
  const pushId = req.query.id || req.body?.pushId;
  const userId = req.body?.userId;
  recordPushClick({ pushId, userId });
  res.json({ success: true });
});

app.post('/api/analytics/push-convert', (req, res) => {
  const pushId = req.query.id || req.body?.pushId;
  const userId = req.body?.userId;
  recordPushConvert({ pushId, userId });
  res.json({ success: true });
});

app.post('/api/analytics/push-prompt', (req, res) => {
  const { status } = req.body || {};
  recordPushPrompt({ status });
  res.json({ success: true });
});

app.post('/api/analytics/sync-offline', (req, res) => {
  const { events } = req.body || {};
  const syncedCount = syncOfflineEvents(events);
  res.json({ success: true, syncedCount });
});

// Web Push APIs
app.get('/api/push/vapid-public-key', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ publicKey: getVapidPublicKey() });
});

app.post('/api/push/subscribe', (req, res) => {
  const { userId, subscription } = req.body || {};
  const saved = savePushSubscription({ userId, subscription });
  res.json({ success: saved });
});

// Admin Authentication Endpoints
app.post('/api/admin/login', handleAdminLogin);
app.post('/api/admin/logout', handleAdminLogout);
app.get('/api/admin/session', requireAdminAuth, handleAdminSessionCheck);
app.post('/api/admin/change-password', requireAdminAuth, handleAdminChangePassword);

// Admin Data & Management Endpoints (Strictly Protected)
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const stats = getAdminDashboardStats(req.query);
  res.json({ success: true, stats });
});

app.post('/api/admin/push/send', requireAdminAuth, async (req, res) => {
  const { title, message, url } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'Notification title and message are required' });
  }
  const result = await sendBroadcastPushNotification({ title, message, url });
  res.json(result);
});

app.get('/api/admin/push/history', requireAdminAuth, (req, res) => {
  res.json({ success: true, history: getNotificationsHistory() });
});

// Scheduled Push Notification Endpoints
app.post('/api/admin/push/schedule', requireAdminAuth, async (req, res) => {
  const { title, message, url, scheduledAt } = req.body || {};
  try {
    const result = await schedulePushNotification({
      title,
      message,
      url,
      scheduledAt,
      source: 'manual'
    });
    res.json({ success: true, scheduledItem: result.scheduledItem });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/push/scheduled', requireAdminAuth, (req, res) => {
  res.json({ success: true, scheduled: getScheduledNotifications() });
});

app.delete('/api/admin/push/scheduled/:id', requireAdminAuth, (req, res) => {
  const cancelled = cancelScheduledNotification(req.params.id);
  res.json({ success: cancelled });
});

app.put('/api/admin/push/scheduled/:id', requireAdminAuth, (req, res) => {
  const { title, message, url, scheduledAt } = req.body || {};
  const updated = updateScheduledNotification(req.params.id, { title, message, url, scheduledAt });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Scheduled notification not found or cannot be modified.' });
  }
  res.json({ success: true, scheduledItem: updated });
});

// AI Contextual Campaign Engine & Auto-Pilot Endpoints
app.get('/api/admin/ai-push/suggestions', requireAdminAuth, async (req, res) => {
  try {
    const stats = getAdminDashboardStats();
    const config = getAiAutoPilotConfig();
    const historyData = getSentTodayAndRecent();
    const campaign = await generateSmartNotificationCampaign({
      stats,
      historyData,
      apiKey: config?.geminiApiKey
    });
    res.json({ success: true, ...campaign });
  } catch (err) {
    console.error('[Admin] Error generating AI push suggestions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/ai-push/auto-schedule', requireAdminAuth, async (req, res) => {
  const { title, message, url, scheduledAt } = req.body || {};
  try {
    const result = await schedulePushNotification({
      title,
      message,
      url,
      scheduledAt,
      source: 'ai_studio'
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/ai-push/autopilot', requireAdminAuth, (req, res) => {
  res.json({ success: true, config: getAiAutoPilotConfig() });
});

app.post('/api/admin/ai-push/autopilot', requireAdminAuth, (req, res) => {
  const { enabled, geminiApiKey } = req.body || {};
  const config = updateAiAutoPilotConfig({ enabled, geminiApiKey });
  res.json({ success: true, config });
});

app.get('/api/admin/ai-push/notices', requireAdminAuth, (req, res) => {
  res.json({ success: true, notices: getSchedulingNotices() });
});

// Admin Analytics Vault Backup & Restore Endpoints
app.get('/api/admin/backup/export', requireAdminAuth, (req, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="bingo-analytics-vault-${Date.now()}.json"`);
  res.json({ success: true, backup: getBackupPayload() });
});

app.post('/api/admin/backup/restore', requireAdminAuth, (req, res) => {
  const { backupData } = req.body || {};
  if (!backupData) {
    return res.status(400).json({ success: false, error: 'No backup payload provided' });
  }
  const restored = restoreBackupData(backupData);
  res.json({ success: restored, stats: getAdminDashboardStats() });
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Process-level crash safety nets
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled promise rejection:', reason);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Bingo high-performance server running on http://localhost:${PORT}`);
});
