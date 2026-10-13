import { PlayIcon, CheckIcon } from './Icons';
import './StartGameModal.css';

export default function StartGameModal({ onStart, onNotNow, playerCount = 2, roundIndex = 1 }) {
  return (
    <div className="modal-overlay" onClick={onNotNow}>
      <div className="modal-content start-game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="start-modal-icon-circle">
          <CheckIcon size={28} />
        </div>

        <div className="start-modal-header">
          <h3>All Players Ready!</h3>
          <p className="start-modal-subtitle">
            All <span className="start-modal-highlight">{playerCount} players</span> have submitted their boards.
            Ready to launch <span className="start-modal-highlight">Round #{roundIndex}</span>?
          </p>
        </div>

        <div className="start-modal-actions">
          <button
            className="btn btn-primary"
            onClick={onStart}
            type="button"
          >
            <PlayIcon size={18} />
            <span>Start Game</span>
          </button>

          <button
            className="btn btn-ghost"
            onClick={onNotNow}
            type="button"
          >
            <span>Not Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
