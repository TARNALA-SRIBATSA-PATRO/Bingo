import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TrophyIcon, SparklesIcon, RefreshIcon, LogOutIcon, CrownIcon, EyeIcon } from './Icons';
import BotBoardModal from './BotBoardModal';
import './GameOverModal.css';

export default function GameOverModal() {
  const { gameOver, isCreator, replayGame, actualLeaveRoom, roomData, playerId } = useGame();
  const [showBotBoard, setShowBotBoard] = useState(false);

  if (!gameOver) return null;

  const isBot = Boolean(roomData?.isBot);
  const botPlayer = roomData?.players?.find(p => p.id === 'bot-opponent');
  const botBoard = gameOver.botBoard || botPlayer?.board || [];
  const botMarkedCells = botPlayer?.markedCells ? [...botPlayer.markedCells] : [];
  const botBingoLines = botPlayer?.bingoLines ? [...botPlayer.bingoLines] : [];

  const winners = gameOver.winners || [];
  const amIWinner = winners.some(w => w.id === playerId);

  const handlePlayAgain = () => {
    replayGame(); // In bot mode resets locally; in multiplayer emits to server
  };

  return (
    <>
      <div className="modal-overlay">
        <div className={`modal-content game-over-modal ${amIWinner ? 'is-winner-modal' : ''}`}>
          
          {/* Animated Celebration Backdrop Glow */}
          <div className="modal-glow-effect" />

          {/* Hero Pedestal Icon */}
          <div className={`modal-hero-pedestal ${amIWinner ? 'pedestal-victory' : 'pedestal-default'}`}>
            <div className="pedestal-ring">
              <TrophyIcon size={38} className="hero-trophy-svg" />
            </div>
            {amIWinner && (
              <>
                <SparklesIcon size={18} className="sparkle-float sparkle-1" />
                <SparklesIcon size={14} className="sparkle-float sparkle-2" />
              </>
            )}
          </div>

          <div className="modal-header-text">
            <h2 className={amIWinner ? 'victory-title' : 'match-title'}>
              {amIWinner ? 'BINGO Victory!' : (isBot ? 'BingoBot Won!' : 'Match Finished')}
            </h2>
            <p className="modal-subtitle">
              {amIWinner
                ? 'Outstanding play! You completed 5 lines first.'
                : (isBot ? 'BingoBot completed 5 lines first. Better luck next round!' : 'Well played! Check out the match result below.')}
            </p>
          </div>

          {/* Winners Section */}
          <div className="winners-showcase">
            <div className="winners-label">
              <span>Winner{winners.length > 1 ? 's' : ''}</span>
              <span className="round-badge">Round #{roomData?.currentGameIndex || 1}</span>
            </div>

            <div className="winners-card-stack">
              {winners.map(w => {
                const isThisPlayer = w.id === playerId;
                return (
                  <div key={w.id} className={`winner-podium-card ${isThisPlayer ? 'current-player-winner' : ''}`}>
                    <div className="winner-podium-left">
                      <span className="winner-icon-bubble">
                        <TrophyIcon size={16} />
                      </span>
                      <div className="winner-info">
                        <span className="winner-display-name">
                          {w.name}
                          {isThisPlayer && <span className="winner-you-pill">You</span>}
                          {!isBot && w.id === roomData?.creatorId && (
                            <span className="winner-host-pill" title="Host">
                              <CrownIcon size={11} />
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="winner-status-tag">Champion</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="game-over-actions">
            {isBot ? (
              <>
                <div className="modal-buttons modal-buttons-bot">
                  <button className="btn btn-primary action-btn-play" onClick={handlePlayAgain} type="button">
                    <RefreshIcon size={16} />
                    <span>Play Next Round</span>
                  </button>
                  <button className="btn btn-secondary action-btn-view-bot" onClick={() => setShowBotBoard(true)} type="button">
                    <EyeIcon size={16} />
                    <span>View Bot's Board</span>
                  </button>
                  <button className="btn btn-ghost action-btn-leave" onClick={() => actualLeaveRoom(true)} type="button">
                    <LogOutIcon size={15} />
                    <span>End & Leave</span>
                  </button>
                </div>
              </>
            ) : isCreator ? (
              <>
                <p className="host-prompt">Host a replay with everyone currently in the room:</p>
                <div className="modal-buttons">
                  <button className="btn btn-primary action-btn-play" onClick={handlePlayAgain} type="button">
                    <RefreshIcon size={16} />
                    <span>Play Next Round</span>
                  </button>
                  <button className="btn btn-ghost action-btn-leave" onClick={() => actualLeaveRoom(true)} type="button">
                    <LogOutIcon size={15} />
                    <span>End & Leave</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="waiting-host-box">
                  <div className="waiting-pulse-dot" />
                  <span>Waiting for the room host to start the next round...</span>
                </div>
                <div className="modal-buttons">
                  <button className="btn btn-ghost action-btn-leave full-width" onClick={() => actualLeaveRoom(true)} type="button">
                    <LogOutIcon size={15} />
                    <span>Leave Room</span>
                  </button>
                </div>
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
          difficulty={roomData?.difficulty || 'pro'}
          onClose={() => setShowBotBoard(false)}
        />
      )}
    </>
  );
}

