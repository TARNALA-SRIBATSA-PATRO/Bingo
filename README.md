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

## Bot training

The bot's `pro` and `intermediate` levels play a learned policy: a linear score over 20 hand-made features of the bot's own card after a candidate call (lines by marks count, fewest extra marks for five lines, how many of the remaining cells would shorten that path, and so on). The bot picks the uncalled number with the best score. It never reads the player's card.

The weights live in `client/src/utils/botPolicy.json` and are imported statically, so there is no runtime dependency and no network. Two scripts at the repo root maintain them (Node 18+, no npm packages):

```bash
node tools/train-bot.mjs          # self-play training, about five minutes, rewrites botPolicy.json
node tools/eval-bot.mjs           # 5000 seeded games per matchup, prints a results table
```

Training is a Monte Carlo policy gradient: the learner samples calls from a softmax over its scores against a mix of random play, the previous hand-written `pro` heuristic and itself, and is rewarded +1 for a win, -1 for a loss, 0 for a draw, minus 0.01 per own call so faster wins count more. Both scripts take `--seed` and `--episodes` / `--games`. Note that half of all marks in a round come from the other player, so even a perfect policy wins only about 47% and loses 34% against the old heuristic, with the rest drawn; the evaluator also prints the average number of marks each policy needs for five lines, where the exact optimum is 18.48.

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
    utils/botPolicy.json    learned weights for the bot (see Bot training)
tools/
  train-bot.mjs             trains botPolicy.json by self-play
  eval-bot.mjs              measures the bot against the old heuristic and random play
  bot-sim.mjs               shared game loop for the two scripts
```
