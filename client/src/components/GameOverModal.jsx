import { useGame } from '../context/GameContext';
import { TrophyIcon, SparklesIcon, RefreshIcon, LogOutIcon, CrownIcon } from './Icons';
import './GameOverModal.css';

export default function GameOverModal() {
  const { gameOver, isCreator, replayGame, actualLeaveRoom, roomData, playerId } = useGame();

  if (!gameOver) return null;

  const winners = gameOver.winners || [];
  const amIWinner = winners.some(w => w.id === playerId);

  const handlePlayAgain = () => {
    replayGame(); // This emits 'game:replay' to server
  };

  return (
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
            {amIWinner ? 'BINGO Victory!' : 'Match Finished'}
          </h2>
          <p className="modal-subtitle">
            {amIWinner
              ? 'Outstanding play! You completed 5 lines first.'
              : 'Well played! Check out the match result below.'}
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
                        {w.id === roomData?.creatorId && (
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
          {isCreator ? (
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
  );
}

