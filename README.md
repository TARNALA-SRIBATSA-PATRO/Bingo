# Bingo

5x5 bingo for up to four players in the browser. Players share a room and play in real time over Socket.IO. There is also an offline mode against a bot, and the client can be installed as a PWA.

## Run locally

You need Node.js 18 or newer. Open two terminals.

Server:

```bash
cd server && npm install && npm run dev
```

Runs on http://localhost:3001.

Client:

```bash
cd client && npm install && npm run dev
```

Runs on http://localhost:5173 and proxies `/socket.io` to the server.

## Build

From the repo root:

```bash
npm run build
```

This installs and builds the client, then installs the server. `npm start` serves the result.

## How a round works

1. Make a room or join one with its code.
2. Each player arranges the numbers 1 to 25 on a 5x5 card and submits it.
3. Players take turns calling a number. It is marked on every card.
4. A full row, column or diagonal is a line. Each line lights the next letter of B-I-N-G-O.
5. Five lines wins the round.
6. The host can start another round in the same room. Wins carry over.

## Project layout

```
server/
  index.js                  rooms, turns, Socket.IO events
  analyticsStore.js
  aiNotificationEngine.js   push notification scheduling, admin only
client/
  src/
    pages/                  LandingPage, HowToPlay, Lobby, BoardSetup, GamePage, LegalPage, AdminDashboard
    context/                SocketContext, GameContext, AudioContext
    components/
    utils/botEngine.js      bot opponent
```
