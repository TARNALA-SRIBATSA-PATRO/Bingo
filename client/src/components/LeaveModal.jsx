import { useState } from 'react';
import { useGame } from '../context/GameContext';
import './LeaveModal.css';

export default function LeaveModal({ onClose }) {
  const { roomData, playerId, isCreator, actualLeaveRoom, transferCreator } = useGame();
  const [selectedTarget, setSelectedTarget] = useState('');
  const [error, setError] = useState('');

  if (!roomData) return null;

  const isBot = Boolean(roomData.isBot);
  const otherPlayers = Object.values(roomData.players || {}).filter(
    p => p.id !== playerId && !p.id.startsWith('bot') && p.id !== 'bot-opponent'
  );

  const handleTransferAndLeave = () => {
    if (!selectedTarget) {
      setError('Please select a player to transfer admin privileges to.');
      return;
    }
    transferCreator(selectedTarget, (res) => {
      if (res?.success) {
        onClose?.();
        actualLeaveRoom(true);
      } else {
        setError(res?.error || 'Failed to transfer privileges.');
      }
    });
  };

  const handleEndAndLeave = () => {
    onClose?.();
    actualLeaveRoom(true);
  };

  const handleDirectLeave = () => {
    onClose?.();
    actualLeaveRoom(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content leave-modal">
        <h3>{isBot ? 'Exit Match' : 'Leave Room'}</h3>
        
        {isBot ? (
          <div>
            <p className="leave-modal-subtext">
              Are you sure you want to exit your game against BingoBot? Your current round progress will be lost.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDirectLeave} type="button">
                Exit Match
              </button>
              <button className="btn btn-ghost" onClick={onClose} type="button">
                Stay in Game
              </button>
            </div>
          </div>
        ) : isCreator ? (
          <div className="creator-warning">
            <p className="warning-text">
              <strong>Warning:</strong> You are the room creator. If you leave now, the game will be over for everyone!
            </p>
            
            {otherPlayers.length > 0 ? (
              <div className="transfer-section">
                <p>If you want to keep the room alive, give admin privileges to another player:</p>
                <select 
                  value={selectedTarget} 
                  onChange={(e) => { setSelectedTarget(e.target.value); setError(''); }}
                  className="player-select"
                >
                  <option value="">-- Select a player --</option>
                  {otherPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {error && <div className="modal-error">{error}</div>}
                
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleTransferAndLeave} type="button">
                    Transfer & Leave
                  </button>
                  <button className="btn btn-danger" onClick={handleEndAndLeave} type="button">
                    End Game & Leave
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={handleEndAndLeave} type="button">
                  End Game & Leave
                </button>
              </div>
            )}
            <button className="btn btn-ghost cancel-btn" onClick={onClose} type="button">Cancel</button>
          </div>
        ) : (
          <div>
            <p>Are you sure you want to leave the room?</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDirectLeave} type="button">Yes, Leave</button>
              <button className="btn btn-ghost" onClick={onClose} type="button">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
