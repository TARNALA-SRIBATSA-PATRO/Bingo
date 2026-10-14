import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, '../client/dist'), {
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
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// rooms: { [roomId]: Room }
// Room: {
//   id, creatorId, players: { [socketId]: Player }, status: 'waiting'|'filling'|'playing',
//   currentTurnIndex, calledNumbers: [], turnOrder: [socketId],
//   winners: [{ name, wins }],  gameHistory: [{ winner, gameIndex }]
// }
// Player: { id, name, board: [[]], markedCells: Set, ready: boolean, bingoLines: Set }

const rooms = {};

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

// Build room data personalized for a specific socket (hides other players' board numbers)
function getRoomDataFor(room, forSocketId) {
  const players = Object.values(room.players).map(p => ({
    id: p.id,
    name: p.name,
    ready: p.ready,
    // Only send board numbers to the owner; everyone else gets [] (privacy)
    board: p.id === forSocketId ? p.board : [],
    markedCells: [...p.markedCells],
    bingoLines: [...p.bingoLines],
    wins: p.wins || 0
  }));
  return {
    id: room.id,
    creatorId: room.creatorId,
    status: room.status,
    players,
    leftPlayers: room.leftPlayers || {},
    currentTurnIndex: room.currentTurnIndex,
    calledNumbers: room.calledNumbers,
    calledHistory: room.calledHistory || [],
    turnOrder: room.turnOrder,
    gameHistory: room.gameHistory,
    currentGameIndex: room.currentGameIndex
  };
}

// Broadcast personalized updates to every player in the room
function broadcastRoom(room) {
  for (const socketId of Object.keys(room.players)) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit('room:update', getRoomDataFor(room, socketId));
    }
  }
}

function checkBingo(board, markedSet) {
  if (!Array.isArray(board) || board.length !== 5 || !Array.isArray(board[0])) return [];
  const lines = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    const cells = [];
    let complete = true;
    for (let c = 0; c < 5; c++) {
      const val = board[r][c];
      cells.push(val);
      if (!markedSet.has(val)) complete = false;
    }
    if (complete) lines.push(`row-${r}`);
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    const cells = [];
    let complete = true;
    for (let r = 0; r < 5; r++) {
      const val = board[r][c];
      cells.push(val);
      if (!markedSet.has(val)) complete = false;
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

function checkSinglePlayerWin(room, io) {
  if (room.status === 'playing' && Object.keys(room.players).length === 1) {
    const lastPlayerId = Object.keys(room.players)[0];
    const lastPlayer = room.players[lastPlayerId];
    
    room.status = 'finished';
    lastPlayer.wins = (lastPlayer.wins || 0) + 1;
    room.gameHistory.push({
      gameIndex: room.currentGameIndex,
      winners: [{ name: lastPlayer.name, id: lastPlayer.id }]
    });
    
    broadcastRoom(room);
    io.to(room.id).emit('game:over', {
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
    delete rooms[roomId];
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
      delete rooms[roomId];
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
  console.log('Client connected:', socket.id);

  // Create room
  socket.on('room:create', ({ name }, cb) => {
    name = (name || '').trim();
    let roomId = generateRoomId().toUpperCase();
    while (rooms[roomId]) roomId = generateRoomId().toUpperCase();

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
      calledHistory: [],   // [{number, calledById}]
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
  });

  // Join room
  socket.on('room:join', ({ name, roomId }, cb) => {
    name = (name || '').trim();
    roomId = (roomId || '').trim().toUpperCase();
    const room = rooms[roomId];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.status === 'playing') return cb({ success: false, error: 'Game already in progress' });
    
    // Max players limit
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

    // Determine turn order:
    // If multiple rounds are played in the same room, the last winner gets the first turn.
    // In the first round (or if the previous winner is no longer in the room),
    // use a fair randomized shuffle algorithm so the creator does not always start first.
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
    let winners = [];
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
    // Send navigation signal FIRST so all clients go to board-setup,
    // then deliver the fresh room state (new gameIndex, empty boards).
    io.to(roomId).emit('game:replaying');
    // Small delay lets the client finish navigating before receiving room:update
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
      // Record their wins before leaving
      room.leftPlayers = room.leftPlayers || {};
      room.leftPlayers[socket.id] = player;
    }

    if (room.creatorId === socket.id && Object.keys(room.players).length > 1) {
      // If creator leaves without transferring, destroy the room
      io.to(roomId).emit('room:destroyed', { message: 'Creator left the room. Game over!' });
      delete rooms[roomId];
      if (cb) cb({ success: true });
      return;
    }

    // Normal leave process
    delete room.players[socket.id];
    const idx = room.turnOrder.indexOf(socket.id);
    if (idx !== -1) {
      room.turnOrder.splice(idx, 1);
      if (room.currentTurnIndex >= room.turnOrder.length) room.currentTurnIndex = 0;
    }

    if (Object.keys(room.players).length === 0) {
      delete rooms[roomId];
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
    
    // Find player by oldPlayerId or name
    let existingPlayer = room.players[oldPlayerId] || Object.values(room.players).find(p => p.name === name);
    let wasLeft = false;
    if (!existingPlayer && room.leftPlayers) {
      existingPlayer = room.leftPlayers[oldPlayerId] || Object.values(room.leftPlayers).find(p => p.name === name);
      if (existingPlayer) wasLeft = true;
    }

    if (!existingPlayer) return cb({ success: false, error: 'Player not found in room' });

    // Migrate player to new socket ID
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
    delete rooms[roomId];
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
      room.leftPlayers[socket.id] = disconnectedPlayer;

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
        delete rooms[roomId];
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

app.get('/api/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    version: '2.3.2',
    buildTime: Date.now()
  });
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Bingo server running on http://localhost:${PORT}`);
});


