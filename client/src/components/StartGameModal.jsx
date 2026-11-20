import { useRef } from 'react';
import { PlayIcon, CheckIcon } from './Icons';
import './StartGameModal.css';
import useModalA11y from '../hooks/useModalA11y';

export default function StartGameModal({ onStart, onNotNow, playerCount = 2, roundIndex = 1 }) {
  const panelRef = useRef(null);
  useModalA11y(panelRef, onNotNow);
  return (
    <div className="modal-overlay" onClick={onNotNow} role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div ref={panelRef} className="modal-content start-game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="start-modal-icon">
          <CheckIcon size={24} />
        </div>

        <div className="start-modal-head">
          <h3 id="start-title">Everyone is ready</h3>
          <p>
            All {playerCount} players have submitted their cards. Start round {roundIndex}?
          </p>
        </div>

        <div className="start-modal-actions">
          <button className="btn btn-primary" onClick={onStart} type="button">
            <PlayIcon size={18} />
            <span>Start round</span>
          </button>
          <button className="btn btn-ghost" onClick={onNotNow} type="button">
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}
