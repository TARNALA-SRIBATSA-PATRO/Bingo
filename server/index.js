import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import crypto from 'crypto';
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
  generateSmartNotificationCampaign,
  saveRoomsSnapshot,
  loadRoomsSnapshot,
  flushStoreNow,
  storeReady
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

// The version the clients compare against must be the version of the bundle we serve, so read it from
// the built client (client/public/version.json is copied into dist by the build). Fall back to package.json.
function readServedVersion() {
  try {
    const built = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/dist/version.json'), 'utf8'));
    if (built && typeof built.version === 'string') return built.version;
  } catch {}
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;
  } catch {}
  return '0.0.0';
}
const CURRENT_VERSION = readServedVersion();
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
      filePath.endsWith('manifest.json') ||
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
  cleanupEmptyChildNamespaces: true,
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 }
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
//
// A room moves through three states: 'filling' (cards are being arranged), 'playing' (a round is
// running) and 'finished' (the result is showing until the creator starts the next round, which
// returns it to 'filling'). Every event checks the state it is allowed in before touching the room,
// and a retried event finds its work already done and answers success without changing anything.
//
// Players have a stable id and a private token for the life of the room; the socket is only the
// current connection. A player who drops out keeps their seat: for 60 s between rounds, and for the
// whole round while one is running (an away player's turn is skipped after 20 s so the table is
// not blocked). Rooms are snapshotted to the store so a server restart is a short pause.
const rooms = {};

const MAX_PLAYERS = 4;
const MAX_LEFT_PLAYERS = 10;
const SEAT_TIMEOUT_MS = 60 * 1000;          // away between rounds
const AWAY_LIMIT_MS = 10 * 60 * 1000;       // away during a round
const TURN_SKIP_MS = 20 * 1000;             // an away player's turn passes after this
const SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000; // restored on boot only if saved within this
const SNAPSHOT_DEBOUNCE_MS = 1000;

function rejected(event, room, reason) {
  console.warn(`[room] ${event} rejected in ${room ? room.id + ' (' + room.status + ')' : 'no room'}: ${reason}`);
  return { success: false, error: reason };
}

function newId(bytes) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// ---------------------------------------------------------------------------------------------
// Persistence. Every mutation bumps the room version (clients drop older room:update frames) and
// schedules a snapshot of all rooms, written at most once a second. Saving never throws.
// ---------------------------------------------------------------------------------------------
let snapshotTimer = null;

function serializePlayer(p) {
  return {
    id: p.id,
    token: p.token,
    name: p.name,
    board: p.board || [],
    markedCells: Array.from(p.markedCells || []),
    bingoLines: Array.from(p.bingoLines || []),
    ready: Boolean(p.ready),
    wins: p.wins || 0
  };
}

function serializeRoom(room) {
  const players = {};
  for (const [id, p] of Object.entries(room.players)) players[id] = serializePlayer(p);
  return {
    id: room.id,
    version: room.version || 0,
    creatorId: room.creatorId,
    status: room.status,
    players,
    turnOrder: room.turnOrder || [],
    currentTurnIndex: room.currentTurnIndex || 0,
    calledNumbers: room.calledNumbers || [],
    calledHistory: room.calledHistory || [],
    gameHistory: room.gameHistory || [],
    leftPlayers: room.leftPlayers || {},
    currentGameIndex: room.currentGameIndex || 1,
    roundPlayerCount: room.roundPlayerCount || 0,
    matchStartTime: room.matchStartTime || null,
    lastActivity: room.lastActivity || Date.now(),
    savedAt: Date.now()
  };
}

function writeSnapshot() {
  snapshotTimer = null;
  try {
    const snapshot = {};
    for (const [id, room] of Object.entries(rooms)) snapshot[id] = serializeRoom(room);
    saveRoomsSnapshot(snapshot);
  } catch (err) {
    console.warn('[room] Snapshot skipped:', err.message);
  }
}

function scheduleSnapshot() {
  if (snapshotTimer) return;
  snapshotTimer = setTimeout(writeSnapshot, SNAPSHOT_DEBOUNCE_MS);
}

function markChanged(room) {
  room.version = (room.version || 0) + 1;
  scheduleSnapshot();
}

// Bring the rooms from the last snapshot back. Everyone is away until their client rejoins, which
// it does on its first connect.
function restoreRooms(snapshot) {
  const now = Date.now();
  let restored = 0;
  for (const saved of Object.values(snapshot || {})) {
    try {
      if (!saved || !saved.id || !saved.players) continue;
      if (!saved.savedAt || now - saved.savedAt > SNAPSHOT_MAX_AGE_MS) continue;
      if (rooms[saved.id]) continue;
      const room = {
        id: saved.id,
        version: saved.version || 0,
        creatorId: saved.creatorId,
        status: ['filling', 'playing', 'finished'].includes(saved.status) ? saved.status : 'filling',
        players: {},
        turnOrder: Array.isArray(saved.turnOrder) ? saved.turnOrder : [],
        currentTurnIndex: saved.currentTurnIndex || 0,
        calledNumbers: saved.calledNumbers || [],
        calledHistory: saved.calledHistory || [],
        gameHistory: saved.gameHistory || [],
        leftPlayers: saved.leftPlayers || {},
        currentGameIndex: saved.currentGameIndex || 1,
        roundPlayerCount: saved.roundPlayerCount || 0,
        matchStartTime: saved.matchStartTime || null,
        lastActivity: now,
        deletionTimer: null,
        turnTimer: null,
        turnDeadline: null,
        turnSkippedFor: null
      };
      for (const p of Object.values(saved.players)) {
        if (!p || !p.id || !p.token || !p.name) continue;
        room.players[p.id] = {
          id: p.id,
          token: p.token,
          name: p.name,
          socketId: null,
          board: Array.isArray(p.board) ? p.board : [],
          markedCells: new Set(p.markedCells || []),
          bingoLines: new Set(p.bingoLines || []),
          ready: Boolean(p.ready),
          wins: p.wins || 0,
          connected: false,
          awaySince: now,
          seatExpiresAt: null,
          seatTimer: null
        };
      }
      if (Object.keys(room.players).length === 0) continue;
      room.turnOrder = room.turnOrder.filter(id => room.players[id]);
      if (room.turnOrder.length) room.currentTurnIndex %= room.turnOrder.length;
      else room.currentTurnIndex = 0;
      if (!room.players[room.creatorId]) room.creatorId = Object.keys(room.players)[0];
      rooms[room.id] = room;
      for (const p of Object.values(room.players)) armSeatTimer(room, p);
      restored++;
    } catch (err) {
      console.warn('[room] Could not restore a room from the snapshot:', err.message);
    }
  }
  if (restored) console.log(`[room] Restored ${restored} room(s) from the last snapshot.`);
}

// Rooms are usable once the store has loaded, so a client that reconnects during a restart does
// not hear that its room is gone a moment before the room is restored.
const roomsReady = storeReady
  .then(() => restoreRooms(loadRoomsSnapshot()))
  .catch(err => console.warn('[room] Snapshot restore failed:', err.message));

function flushRoomsNow() {
  if (snapshotTimer) {
    clearTimeout(snapshotTimer);
    snapshotTimer = null;
  }
  writeSnapshot();
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
function makePlayer(name, { id, token, wins = 0, socketId = null } = {}) {
  return {
    id: id || newId(6),
    token: token || newId(18),
    name,
    socketId,
    board: [],
    markedCells: new Set(),
    bingoLines: new Set(),
    ready: false,
    wins: wins || 0,
    connected: Boolean(socketId),
    awaySince: socketId ? null : Date.now(),
    seatExpiresAt: null,
    seatTimer: null
  };
}

function sameBoard(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (!Array.isArray(a[r]) || !Array.isArray(b[r]) || a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) if (a[r][c] !== b[r][c]) return false;
  }
  return true;
}

function connectedPlayers(room) {
  return Object.values(room.players).filter(p => p.connected !== false);
}

function currentTurnPlayer(room) {
  return room.players[room.turnOrder[room.currentTurnIndex]] || null;
}

// Clean up room and cancel all associated timers to prevent memory leaks
function cleanupRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.deletionTimer) clearTimeout(room.deletionTimer);
  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.deletionTimer = null;
  room.turnTimer = null;

  for (const player of Object.values(room.players || {})) {
    if (player.seatTimer) clearTimeout(player.seatTimer);
    player.seatTimer = null;
  }

  delete rooms[roomId];
  scheduleSnapshot();
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

// Remove a player from the turn order without skipping anyone's turn
function removeFromTurnOrder(room, playerId) {
  const idx = room.turnOrder.indexOf(playerId);
  if (idx === -1) return;
  room.turnOrder.splice(idx, 1);
  if (idx < room.currentTurnIndex) room.currentTurnIndex--;
  if (room.turnOrder.length) room.currentTurnIndex %= room.turnOrder.length;
  else room.currentTurnIndex = 0;
}

// Keep a short record of who left so their wins stay on the board and they can take a seat again
// under the same name. One entry per name, newest last, capped so a long session cannot grow it.
function rememberLeftPlayer(room, player) {
  room.leftPlayers = room.leftPlayers || {};
  const lower = player.name.toLowerCase();
  for (const [key, p] of Object.entries(room.leftPlayers)) {
    if (p.name.toLowerCase() === lower) delete room.leftPlayers[key];
  }
  room.leftPlayers[player.id] = { id: player.id, token: player.token, name: player.name, wins: player.wins || 0 };
  const keys = Object.keys(room.leftPlayers);
  while (keys.length > MAX_LEFT_PLAYERS) delete room.leftPlayers[keys.shift()];
}

// Whoever takes over the creator role when the creator's seat goes: the first connected player.
function pickCreator(room) {
  const next = connectedPlayers(room)[0] || Object.values(room.players)[0];
  return next ? next.id : null;
}

// Find the winner from the last game in the room (if they are still active in the room)
function getLastWinnerPlayer(room) {
  if (!room.gameHistory || room.gameHistory.length === 0) return null;
  const lastGame = room.gameHistory[room.gameHistory.length - 1];
  if (!lastGame || !Array.isArray(lastGame.winners) || lastGame.winners.length === 0) return null;
  // A draw has no single winner; fall back to the random start
  if (lastGame.draw || lastGame.winners.length > 1) return null;

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
    connected: p.connected !== false,
    awaySince: p.connected === false ? (p.awaySince || null) : null,
    seatExpiresAt: p.connected === false ? (p.seatExpiresAt || null) : null,
    _rawBoard: p.board || []
  }));

  const baseData = {
    id: room.id,
    version: room.version || 0,
    creatorId: room.creatorId,
    status: room.status,
    leftPlayers: room.leftPlayers || {},
    currentTurnIndex: room.currentTurnIndex,
    calledNumbers: room.calledNumbers || [],
    calledHistory: room.calledHistory || [],
    turnOrder: room.turnOrder || [],
    gameHistory: room.gameHistory || [],
    currentGameIndex: room.currentGameIndex,
    turnDeadline: room.turnDeadline || null,
    turnSkippedFor: room.turnSkippedFor || null
  };

  for (const p of Object.values(room.players)) {
    const targetSocket = p.socketId && io.sockets.sockets.get(p.socketId);
    if (!targetSocket) continue;
    const players = basePlayers.map(bp => ({
      id: bp.id,
      name: bp.name,
      ready: bp.ready,
      board: bp.id === p.id ? bp._rawBoard : [],
      markedCells: bp.markedCells,
      bingoLines: bp.bingoLines,
      wins: bp.wins,
      connected: bp.connected,
      awaySince: bp.awaySince,
      seatExpiresAt: bp.seatExpiresAt
    }));
    targetSocket.emit('room:update', { ...baseData, players });
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

function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== 5) return 'Invalid board';
  const flat = board.flat();
  if (flat.length !== 25) return 'Invalid board size';
  const unique = new Set(flat);
  if (unique.size !== 25) return 'Duplicate numbers found';
  for (const n of flat) {
    if (!Number.isInteger(n) || n < 1 || n > 25) return 'Numbers must be 1-25';
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Seats, away players and the turn clock
// ---------------------------------------------------------------------------------------------

// How long an away player's seat is held depends on whether a round is running.
function armSeatTimer(room, player) {
  if (player.seatTimer) clearTimeout(player.seatTimer);
  player.seatTimer = null;
  if (player.connected !== false) {
    player.seatExpiresAt = null;
    return;
  }
  const limit = room.status === 'playing' ? AWAY_LIMIT_MS : SEAT_TIMEOUT_MS;
  player.seatExpiresAt = (player.awaySince || Date.now()) + limit;
  const delay = Math.max(0, player.seatExpiresAt - Date.now());
  player.seatTimer = setTimeout(() => {
    const current = rooms[room.id];
    if (!current) return;
    const p = current.players[player.id];
    if (!p || p.connected !== false) return;
    removeSeat(current, p.id);
  }, delay);
}

// When the player whose turn it is has dropped out, the turn passes after TURN_SKIP_MS so the table
// is not blocked, as long as someone is there to play.
function armTurnTimer(room) {
  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.turnTimer = null;
  room.turnDeadline = null;
  if (room.status !== 'playing' || room.turnOrder.length === 0) return;
  const current = currentTurnPlayer(room);
  if (!current || current.connected !== false) return;
  if (connectedPlayers(room).length === 0) return;

  room.turnDeadline = Date.now() + TURN_SKIP_MS;
  room.turnTimer = setTimeout(() => {
    room.turnTimer = null;
    room.turnDeadline = null;
    const cur = rooms[room.id];
    if (!cur || cur.status !== 'playing' || cur.turnOrder.length === 0) return;
    const p = currentTurnPlayer(cur);
    if (!p || p.connected !== false) return;
    cur.currentTurnIndex = (cur.currentTurnIndex + 1) % cur.turnOrder.length;
    cur.turnSkippedFor = { id: p.id, name: p.name };
    markChanged(cur);
    armTurnTimer(cur);
    broadcastRoom(cur);
    cur.turnSkippedFor = null;
  }, TURN_SKIP_MS);
}

function finishRound(room, winners, draw) {
  room.status = 'finished';
  if (!draw) winners.forEach(w => { w.wins = (w.wins || 0) + 1; });
  room.gameHistory.push({
    gameIndex: room.currentGameIndex,
    winners: winners.map(w => ({ name: w.name, id: w.id })),
    ...(draw ? { draw: true } : {})
  });
  // Cap game history to 20 to prevent unbounded memory growth
  if (room.gameHistory.length > 20) room.gameHistory.shift();

  const durationMs = room.matchStartTime ? (Date.now() - room.matchStartTime) : null;
  recordMultiplayerGameCompleted({ durationMs, playerCount: room.roundPlayerCount || Object.keys(room.players).length });

  armTurnTimer(room);
  // The round held every seat; from here on an away seat is held for the between-round time,
  // counted from when they dropped out.
  for (const p of Object.values(room.players)) {
    if (p.connected === false) armSeatTimer(room, p);
  }

  markChanged(room);
  broadcastRoom(room);
  io.to(room.id).emit('game:over', {
    roomId: room.id,
    winners: winners.map(w => ({ name: w.name, id: w.id, wins: w.wins })),
    draw,
    gameHistory: room.gameHistory
  });
}

// A round with one player left in it ends in their favour.
function checkSinglePlayerWin(room) {
  if (room.status !== 'playing' || Object.keys(room.players).length !== 1) return;
  const lastPlayer = Object.values(room.players)[0];
  finishRound(room, [lastPlayer], false);
}

function touchRoomActivity(room, savedBy = null) {
  if (!room) return;
  room.lastActivity = Date.now();
  if (room.deletionTimer) {
    clearTimeout(room.deletionTimer);
    room.deletionTimer = null;
    io.to(room.id).emit('room:inactivityCancelled', { roomId: room.id, savedBy });
  }
}

function startRoomDeletionCountdown(room, isSolo, totalPlayers) {
  if (!room || room.deletionTimer) return;
  const roomId = room.id;

  // Emit 10-second warning countdown to all players in the room
  io.to(roomId).emit('room:inactivityWarning', {
    roomId,
    countdown: 10,
    isSolo,
    totalPlayers
  });

  room.deletionTimer = setTimeout(() => {
    const currentRoom = rooms[roomId];
    if (!currentRoom) return;

    io.to(roomId).emit('room:deletedForInactivity', {
      roomId,
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
    // Seats are only ever emptied by the per-player timers; a room goes when its last seat does.
    if (Object.keys(room.players).length === 0) {
      cleanupRoom(roomId);
      continue;
    }

    if (!room.deletionTimer) {
      const idleTime = now - (room.lastActivity || now);
      const seats = Object.keys(room.players).length;
      const isSolo = seats === 1;
      const threshold = isSolo ? SOLO_INACTIVITY_MS : MULTI_INACTIVITY_MS;

      if (idleTime >= threshold) {
        startRoomDeletionCountdown(room, isSolo, connectedPlayers(room).length);
      }
    }
  }
}, 5000);

// Take a seat out of the room (explicit leave or a timer) and settle what follows: creator handover,
// a round that is left with one player, an empty room. Returns false if the room is gone.
function removeSeat(room, playerId) {
  const player = room.players[playerId];
  if (!player) return Boolean(rooms[room.id]);
  if (player.seatTimer) clearTimeout(player.seatTimer);
  player.seatTimer = null;

  rememberLeftPlayer(room, player);
  delete room.players[playerId];
  removeFromTurnOrder(room, playerId);

  if (Object.keys(room.players).length === 0) {
    cleanupRoom(room.id);
    return false;
  }

  if (room.creatorId === playerId) room.creatorId = pickCreator(room);
  if (Object.keys(room.players).length === 1) touchRoomActivity(room);

  markChanged(room);
  checkSinglePlayerWin(room);
  armTurnTimer(room);
  broadcastRoom(room);
  io.to(room.id).emit('player:left', { roomId: room.id, name: player.name });
  return true;
}

function attachSocket(socket, room, player) {
  player.socketId = socket.id;
  player.connected = true;
  player.awaySince = null;
  armSeatTimer(room, player);
  socket.join(room.id);
  socket.data.roomId = room.id;
  socket.data.playerId = player.id;
  socket.data.name = player.name;
}

function seatReply(room, player) {
  return { success: true, roomId: room.id, playerId: player.id, token: player.token, status: room.status };
}

// Put a returning player back in their seat on a new connection. A seat that is still in the room
// is restored exactly (card, marks, lines, turn slot). A seat that was given up comes back fresh
// with the wins restored; it keeps its credentials only when the rejoin proved them (fresh is
// set when someone took the seat over by name alone).
function seatReturningPlayer(socket, room, { player, wasLeft, fresh }, cb) {
  if (wasLeft) {
    delete room.leftPlayers[player.id];
    player = makePlayer(player.name, {
      id: fresh ? null : player.id,
      token: fresh ? null : player.token,
      wins: player.wins,
      socketId: socket.id
    });
    room.players[player.id] = player;
  }

  attachSocket(socket, room, player);
  markChanged(room);
  touchRoomActivity(room);
  armTurnTimer(room);

  cb(seatReply(room, player));
  broadcastRoom(room);
}

// A socket belongs to one room at a time. Before it creates or joins another, its current seat is
// given up exactly as if it had pressed Leave.
function leaveRoom(socket) {
  const { roomId, playerId } = socket.data;
  const room = roomId && rooms[roomId];
  socket.data.roomId = null;
  socket.data.playerId = null;
  if (!room) return;

  socket.leave(roomId);
  const player = room.players[playerId];
  // A seat that moved to another connection is not this socket's to give up.
  if (!player || player.socketId !== socket.id) return;

  if (room.creatorId === playerId && Object.keys(room.players).length > 1) {
    // The others are told; the leaver already knows.
    socket.to(roomId).emit('room:destroyed', { roomId, message: 'The host closed the room.' });
    cleanupRoom(roomId);
    return;
  }

  removeSeat(room, playerId);
}

// ---------------------------------------------------------------------------------------------
// Socket handlers
// ---------------------------------------------------------------------------------------------
io.on('connection', (socket) => {
  // Every handler gets a plain-object payload and a callable cb, waits for the rooms to be
  // restored, and a thrown error becomes an error reply instead of a crashed handler.
  const on = (event, handler) => {
    socket.on(event, (payload, cb) => {
      if (typeof payload === 'function') { cb = payload; payload = {}; }
      if (!payload || typeof payload !== 'object') payload = {};
      const reply = typeof cb === 'function' ? cb : () => {};
      roomsReady.then(() => handler(payload, reply)).catch((err) => {
        console.error(`[room] ${event} failed:`, err);
        reply({ success: false, error: 'Something went wrong on the server. Try again.' });
      });
    });
  };

  // The room and seat this connection holds. A seat that has moved to a newer connection of the
  // same player no longer answers to this one.
  const mySeat = () => {
    const room = socket.data.roomId ? rooms[socket.data.roomId] : null;
    if (!room) return { room: null, player: null };
    const player = room.players[socket.data.playerId] || null;
    if (player && player.socketId !== socket.id) return { room, player: null, elsewhere: true };
    return { room, player };
  };

  // Create room
  on('room:create', ({ name }, cb) => {
    name = String(name || '').trim();
    if (!name) return cb(rejected('room:create', null, 'Enter a name first.'));
    leaveRoom(socket);

    let roomId = generateRoomId().toUpperCase();
    let attempts = 0;
    while (rooms[roomId] && attempts < 20) {
      roomId = generateRoomId().toUpperCase();
      attempts++;
    }

    const player = makePlayer(name, { socketId: socket.id });
    const room = {
      id: roomId,
      version: 0,
      creatorId: player.id,
      players: { [player.id]: player },
      status: 'filling',
      currentTurnIndex: 0,
      calledNumbers: [],
      calledHistory: [], // [{number, calledById}]
      turnOrder: [],
      gameHistory: [],
      leftPlayers: {},
      currentGameIndex: 1,
      roundPlayerCount: 0,
      matchStartTime: null,
      lastActivity: Date.now(),
      deletionTimer: null,
      turnTimer: null,
      turnDeadline: null,
      turnSkippedFor: null
    };
    rooms[roomId] = room;
    attachSocket(socket, room, player);
    markChanged(room);

    cb(seatReply(room, player));
    broadcastRoom(room);
    recordMultiplayerRoomCreated();
  });

  // Join room
  on('room:join', ({ name, roomId }, cb) => {
    name = String(name || '').trim();
    roomId = String(roomId || '').trim().toUpperCase();
    if (!name) return cb(rejected('room:join', null, 'Enter a name first.'));
    const room = rooms[roomId];
    if (!room) return cb(rejected('room:join', null, 'Room not found'));
    const lower = name.toLowerCase();

    const seated = Object.values(room.players).find(p => p.name.toLowerCase() === lower);
    if (seated) {
      if (seated.connected !== false) return cb(rejected('room:join', room, 'Name already taken in this room'));
      if (room.status === 'playing') {
        return cb(rejected('room:join', room, 'A player with that name is in the round and may come back. Pick another name or wait for the round to end.'));
      }
      // Between rounds an abandoned seat with this name goes, and the newcomer takes a fresh one
      // with those wins.
      removeSeat(room, seated.id);
      if (!rooms[roomId]) return cb(rejected('room:join', null, 'Room not found'));
    }

    const left = Object.values(room.leftPlayers || {}).find(p => p.name.toLowerCase() === lower);
    if (left) {
      if (socket.data.roomId !== roomId) leaveRoom(socket);
      return seatReturningPlayer(socket, room, { player: left, wasLeft: true, fresh: true }, cb);
    }

    if (room.status === 'playing') {
      return cb(rejected('room:join', room, 'A round is in progress in that room. You can join once it ends and the host starts the next one.'));
    }
    if (room.status === 'finished') {
      return cb(rejected('room:join', room, 'That room is between rounds. You can join once the host starts the next one.'));
    }
    if (Object.keys(room.players).length >= MAX_PLAYERS) {
      return cb(rejected('room:join', room, 'Room is full (max 4 players)'));
    }

    leaveRoom(socket);
    const player = makePlayer(name, { socketId: socket.id });
    room.players[player.id] = player;
    attachSocket(socket, room, player);
    markChanged(room);
    touchRoomActivity(room);

    cb(seatReply(room, player));
    broadcastRoom(room);
  });

  // Auto-rejoin with the saved seat credentials. There is no fallback by name: a seat that is still
  // in the room belongs to whoever holds its token.
  on('room:rejoin', ({ roomId, playerId, token }, cb) => {
    roomId = String(roomId || '').trim().toUpperCase();
    const room = rooms[roomId];
    if (!room) return cb(rejected('room:rejoin', null, 'Room not found'));
    if (!playerId || !token) return cb(rejected('room:rejoin', room, 'Player not found in room'));

    let seat = null;
    const player = room.players[playerId];
    if (player && player.token === token) seat = { player, wasLeft: false };
    const left = room.leftPlayers?.[playerId];
    if (!seat && left && left.token === token) seat = { player: left, wasLeft: true };
    if (!seat) return cb(rejected('room:rejoin', room, 'Player not found in room'));

    if (socket.data.roomId && socket.data.roomId !== roomId) leaveRoom(socket);
    seatReturningPlayer(socket, room, seat, cb);
  });

  // Player submits board
  on('board:submit', ({ board }, cb) => {
    const { room, player, elsewhere } = mySeat();
    if (!room) return cb(rejected('board:submit', null, 'Room not found'));
    if (elsewhere) return cb(rejected('board:submit', room, 'Your seat is open in another tab.'));
    if (!player) return cb(rejected('board:submit', room, 'Player not found'));

    if (room.status === 'playing') return cb(rejected('board:submit', room, 'The round has already started.'));
    if (room.status === 'finished') return cb(rejected('board:submit', room, 'The round is over. The host can start the next one.'));

    const problem = validateBoard(board);
    if (problem) return cb(rejected('board:submit', room, problem));

    touchRoomActivity(room);
    // The same card sent twice (a retry after a blip) is already in place.
    if (player.ready && sameBoard(player.board, board)) return cb({ success: true });

    player.board = board;
    player.ready = true;
    player.markedCells = new Set();
    player.bingoLines = new Set();

    markChanged(room);
    cb({ success: true });
    broadcastRoom(room);
  });

  // Start game (creator only)
  on('game:start', (_, cb) => {
    const { room, player } = mySeat();
    if (!room) return cb(rejected('game:start', null, 'Room not found'));
    if (!player || room.creatorId !== player.id) return cb(rejected('game:start', room, 'Only creator can start'));
    // A retried start finds the round already running.
    if (room.status === 'playing') return cb({ success: true });
    if (room.status === 'finished') return cb(rejected('game:start', room, 'The round is over. Use Next round to play again.'));

    touchRoomActivity(room);
    const seated = connectedPlayers(room);
    const ready = seated.filter(p => p.ready);
    if (ready.length < 2) return cb(rejected('game:start', room, 'Need at least 2 players'));
    if (!seated.every(p => p.ready)) return cb(rejected('game:start', room, 'All players must be ready'));

    // A player who is away when the round starts sits this one out; their card is not in play.
    for (const p of Object.values(room.players)) {
      if (p.connected === false) {
        p.board = [];
        p.ready = false;
      }
      p.markedCells = new Set();
      p.bingoLines = new Set();
    }

    room.status = 'playing';
    const playerIds = ready.map(p => p.id);
    const lastWinner = getLastWinnerPlayer(room);

    if (lastWinner && playerIds.includes(lastWinner.id)) {
      const otherPlayers = shuffleArray(playerIds.filter(id => id !== lastWinner.id));
      room.turnOrder = [lastWinner.id, ...otherPlayers];
    } else {
      room.turnOrder = shuffleArray(playerIds);
    }

    room.currentTurnIndex = 0;
    room.calledNumbers = [];
    room.calledHistory = [];
    room.matchStartTime = Date.now();
    room.roundPlayerCount = playerIds.length;

    markChanged(room);
    armTurnTimer(room);
    cb({ success: true });
    broadcastRoom(room);
    io.to(room.id).emit('game:started', { roomId: room.id, currentTurn: room.turnOrder[0] });
  });

  // Call a number (current turn player)
  on('game:callNumber', ({ number }, cb) => {
    const { room, player, elsewhere } = mySeat();
    if (!room) return cb(rejected('game:callNumber', null, 'Room not found'));
    if (elsewhere) return cb(rejected('game:callNumber', room, 'Your seat is open in another tab.'));
    if (!player) return cb(rejected('game:callNumber', room, 'Player not found'));
    if (room.status === 'finished') return cb(rejected('game:callNumber', room, 'The round is over.'));
    if (room.status !== 'playing') return cb(rejected('game:callNumber', room, 'Game not in progress'));

    number = Number(number);
    if (!Number.isInteger(number) || number < 1 || number > 25) return cb(rejected('game:callNumber', room, 'Invalid number'));

    touchRoomActivity(room);
    if (room.calledNumbers.includes(number)) {
      // The same player calling the same number again is a retry of a call that already went through.
      const entry = room.calledHistory.find(h => h.number === number);
      if (entry && entry.calledById === player.id) return cb({ success: true });
      return cb(rejected('game:callNumber', room, 'Number already called'));
    }
    const turnPlayer = currentTurnPlayer(room);
    if (!turnPlayer || turnPlayer.id !== player.id) return cb(rejected('game:callNumber', room, 'Not your turn'));

    room.calledNumbers.push(number);
    room.calledHistory.push({ number, calledById: player.id });

    // Mark number for all players and check bingo
    const winners = [];
    for (const p of Object.values(room.players)) {
      if (!Array.isArray(p.board) || p.board.length !== 5) continue;
      const flat = p.board.flat();
      if (flat.includes(number)) {
        p.markedCells.add(number);
      }

      const newLines = checkBingo(p.board, p.markedCells);
      newLines.forEach(l => p.bingoLines.add(l));

      // B-I-N-G-O: 5 lines = win
      if (p.bingoLines.size >= 5) {
        winners.push(p);
      }
    }

    if (winners.length > 0) {
      // Two or more players completing five lines on the same call is a draw: no wins awarded
      finishRound(room, winners, winners.length > 1);
      return cb({ success: true });
    }

    // Next turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
    markChanged(room);
    armTurnTimer(room);
    broadcastRoom(room);
    io.to(room.id).emit('game:numberCalled', {
      roomId: room.id,
      number,
      calledBy: player.name,
      nextTurn: room.turnOrder[room.currentTurnIndex]
    });

    cb({ success: true });
  });

  // Replay game (creator only). The client sends the round it is finishing so a second tap for the
  // same round, or a tap that arrives after the room already moved on, changes nothing.
  on('game:replay', ({ gameIndex }, cb) => {
    const { room, player } = mySeat();
    if (!room) return cb(rejected('game:replay', null, 'Room not found'));
    if (!player || room.creatorId !== player.id) return cb(rejected('game:replay', room, 'Only creator can replay'));
    if (room.status === 'filling') return cb({ success: true });
    if (room.status === 'playing') return cb(rejected('game:replay', room, 'A round is in progress.'));
    const finishing = Number(gameIndex);
    if (Number.isInteger(finishing) && finishing !== room.currentGameIndex) return cb({ success: true });

    touchRoomActivity(room);
    room.currentGameIndex++;
    room.status = 'filling';
    room.calledNumbers = [];
    room.calledHistory = [];
    room.currentTurnIndex = 0;
    room.turnOrder = [];
    room.roundPlayerCount = 0;
    room.matchStartTime = null;

    for (const p of Object.values(room.players)) {
      p.board = [];
      p.markedCells = new Set();
      p.bingoLines = new Set();
      p.ready = false;
    }

    markChanged(room);
    armTurnTimer(room);
    cb({ success: true });
    io.to(room.id).emit('game:replaying', { roomId: room.id, gameIndex: room.currentGameIndex });
    broadcastRoom(room);
  });

  // Transfer Creator
  on('room:transferCreator', ({ targetId }, cb) => {
    const { room, player } = mySeat();
    if (!room) return cb(rejected('room:transferCreator', null, 'Room not found'));
    if (!player || room.creatorId !== player.id) return cb(rejected('room:transferCreator', room, 'Only creator can transfer privilege'));
    const target = room.players[targetId];
    if (!target) return cb(rejected('room:transferCreator', room, 'Target player not found'));
    if (target.connected === false) return cb(rejected('room:transferCreator', room, `${target.name} is not connected right now.`));
    if (room.creatorId === targetId) return cb({ success: true });

    touchRoomActivity(room);
    room.creatorId = targetId;
    markChanged(room);
    cb({ success: true });
    broadcastRoom(room);
  });

  // Leave room explicitly
  on('room:leave', (_, cb) => {
    leaveRoom(socket);
    cb({ success: true });
  });

  // Player activity heartbeat from client
  on('room:activity', () => {
    const { room } = mySeat();
    if (!room) return;
    if (!room.deletionTimer) {
      room.lastActivity = Date.now();
    }
  });

  // Player clicked "Do Not Delete" button in inactivity countdown modal
  on('room:keepAlive', () => {
    const { room, player } = mySeat();
    if (!room) return;
    touchRoomActivity(room, player?.name || socket.data.name || 'A player');
  });

  // The creator chose to close the room now from the inactivity modal; everyone is told.
  on('room:deleteNow', (_, cb) => {
    const { room, player } = mySeat();
    if (!room) return cb({ success: true });
    if (!player || room.creatorId !== player.id) return cb(rejected('room:deleteNow', room, 'Only the host can close the room.'));
    io.to(room.id).emit('room:deletedForInactivity', {
      roomId: room.id,
      message: 'The host closed the room.'
    });
    cleanupRoom(room.id);
    cb({ success: true });
  });

  socket.on('disconnect', () => {
    const { roomId, playerId } = socket.data;
    const room = roomId && rooms[roomId];
    if (!room) return;
    const player = room.players[playerId];
    // The seat may already be on a newer connection of the same player.
    if (!player || player.socketId !== socket.id) return;

    player.socketId = null;
    player.connected = false;
    player.awaySince = Date.now();
    armSeatTimer(room, player);
    armTurnTimer(room);

    markChanged(room);
    broadcastRoom(room);
  });
});

// Write the last snapshot before the process goes, so a deploy restart loses nothing.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    try { flushRoomsNow(); flushStoreNow(); } catch {}
    process.exit(0);
  });
}

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
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`Bingo server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
