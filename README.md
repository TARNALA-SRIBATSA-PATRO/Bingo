# Bingo Multiplayer Game

## 🎮 Getting Started

### Prerequisites
- Node.js v18+ and npm

### Setup & Run

Open **two terminals**:

**Terminal 1 — Backend server:**
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```
App runs on `http://localhost:5173`

---

## 🎯 How to Play

1. **Landing Page** → Click "Start Game"
2. **Create Room** → Enter your name → Get a Room ID
3. **Share Room ID** with your friend → They click "Join Room"
4. **Fill Your 5×5 Board**:
   - Click cells sequentially (auto-fills 1, 2, 3...)
   - Click a filled cell to remove it (goes to the unselected stack)
   - Click a stack number then click empty cell to place it
   - Use **Manual Input** to type numbers (no duplicates, 1-25 only)
   - Use **Auto Fill** for instant random board
5. **Submit Board** when all 25 cells are filled
6. Room creator clicks **Start Game** once all players are ready
7. **Take Turns** — click a number to call it; it auto-marks on all boards
8. Complete rows/columns/diagonals to earn **B-I-N-G-O** letters
9. First to complete **5 lines** wins!
10. Creator can **Replay** in the same room — win counts persist

---

## 📁 Project Structure

```
Bingo/
├── server/          # Node.js + Socket.IO backend
│   └── index.js     # Game logic, room management
├── client/          # React + Vite frontend
│   └── src/
│       ├── context/ # SocketContext, GameContext
│       ├── pages/   # LandingPage, HowToPlay, Lobby, BoardSetup, GamePage
│       └── components/ # Notification
└── README.md
```
