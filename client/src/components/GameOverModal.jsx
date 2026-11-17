import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { TrophyIcon, RefreshIcon, LogOutIcon, CrownIcon, EyeIcon } from './Icons';
import { checkBingoLines } from '../utils/botEngine';
import BotBoardModal from './BotBoardModal';
import Confetti from './Confetti';
import { playSfx } from '../utils/sfx';
import './GameOverModal.css';

export default function GameOverModal() {
  const { gameOver, isCreator, replayGame, actualLeaveRoom, roomData, playerId } = useGame();
  const [showBotBoard, setShowBotBoard] = useState(false);

  // One sound when the result appears.
  useEffect(() => {
    if (!gameOver) return;
    const ws = gameOver.winners || [];
    const draw = Boolean(gameOver.draw) || ws.length > 1;
    const won = !draw && ws.some(w => w.id === playerId);
    playSfx(won ? 'win' : draw ? 'line' : 'lose');
  }, [gameOver, playerId]);

  if (!gameOver) return null;

  const isBot = Boolean(roomData?.isBot);
  const botPlayer = roomData?.players?.find(p => p.id === 'bot-opponent');
  const botBoard = gameOver.botBoard || botPlayer?.board || [];

  const allCalled = gameOver.calledNumbers || roomData?.calledNumbers || [];
  const lastMove = gameOver.lastCalledNumber ?? (allCalled.length > 0 ? allCalled[allCalled.length - 1] : null);

  const botMarkedCells = useMemo(() => {
    const set = new Set();
    (gameOver.botMarkedCells || []).forEach(n => set.add(Number(n)));
    (botPlayer?.markedCells || []).forEach(n => set.add(Number(n)));
    allCalled.forEach(n => set.add(Number(n)));
    if (lastMove !== null && lastMove !== undefined) set.add(Number(lastMove));
    return Array.from(set);
  }, [gameOver.botMarkedCells, botPlayer?.markedCells, allCalled, lastMove]);

  const botBingoLines = useMemo(() => {
    if (!botBoard || botBoard.length !== 5) return [];
    const recalc = checkBingoLines(botBoard, new Set(botMarkedCells));
    return Array.from(new Set([...(gameOver.botBingoLines || []), ...recalc]));
  }, [gameOver.botBingoLines, botBoard, botMarkedCells]);

  const winners = gameOver.winners || [];
  const isDraw = Boolean(gameOver.draw) || winners.length > 1;
  const amIWinner = !isDraw && winners.some(w => w.id === playerId);
  const round = roomData?.currentGameIndex || 1;

  const title = isDraw ? 'Draw' : amIWinner ? 'You won' : isBot ? 'The bot won' : 'Round over';
  const subtitle = isDraw
    ? `${winners.map(w => w.name).join(' and ')} reached five lines on the same call.`
    : amIWinner
      ? `You reached five lines first in round ${round}.`
      : isBot
        ? `The bot reached five lines first in round ${round}.`
        : `${winners.map(w => w.name).join(' and ')} reached five lines first.`;

  return (
    <>
      {amIWinner && <Confetti />}
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
        <div className={`modal-content game-over-modal ${amIWinner ? 'is-winner' : ''}`}>
          <div className="game-over-badge">
            <TrophyIcon size={28} />
          </div>

          <div className="game-over-head">
            <h2 id="game-over-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="winners-list">
            <div className="winners-head">
              <span className="eyebrow">{isDraw ? 'Drawn between' : 'Winner'}</span>
              <span className="tag">Round {round}</span>
            </div>
            {winners.map(w => (
              <div key={w.id} className={`winner-row ${w.id === playerId ? 'is-you' : ''}`}>
                <TrophyIcon size={16} />
                <span className="winner-name">{w.name}</span>
                {w.id === playerId && <span className="tag tag-brass">You</span>}
                {!isBot && w.id === roomData?.creatorId && (
                  <span className="winner-host" title="Host"><CrownIcon size={12} /></span>
                )}
              </div>
            ))}
          </div>

          <div className="game-over-actions">
            {isBot ? (
              <>
                <button className="btn btn-primary" onClick={() => replayGame()} type="button">
                  <RefreshIcon size={16} />
                  <span>Next round</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBotBoard(true)} type="button">
                  <EyeIcon size={16} />
                  <span>See the bot's card</span>
                </button>
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Leave</span>
                </button>
              </>
            ) : isCreator ? (
              <>
                <p className="host-note">Everyone still in the room will join the next round.</p>
                <button className="btn btn-primary" onClick={() => replayGame()} type="button">
                  <RefreshIcon size={16} />
                  <span>Next round</span>
                </button>
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Close room and leave</span>
                </button>
              </>
            ) : (
              <>
                <div className="waiting-host" role="status">
                  <span className="waiting-dot" aria-hidden="true" />
                  <span>Waiting for the host to start the next round</span>
                </div>
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Leave room</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBotBoard && (
        <BotBoardModal
          board={botBoard}
          markedCells={botMarkedCells}
          bingoLines={botBingoLines}
          lastMove={lastMove}
          difficulty={roomData?.difficulty || 'pro'}
          onClose={() => setShowBotBoard(false)}
        />
      )}
    </>
  );
}
