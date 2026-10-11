import { useState } from 'react';
import { useGame } from '../context/GameContext';
import './LeaveModal.css';

export default function LeaveModal({ onClose }) {
  const { roomData, playerId, isCreator, actualLeaveRoom, transferCreator } = useGame();
  const [selectedTarget, setSelectedTarget] = useState('');
  const [error, setError] = useState('');

  if (!roomData) return null;

  const otherPlayers = Object.values(roomData.players || {}).filter(p => p.id !== playerId);

  const handleTransferAndLeave = () => {
    if (!selectedTarget) {
      setError('Please select a player to transfer admin privileges to.');
      return;
    }
    transferCreator(selectedTarget, (res) => {
      if (res.success) {
        actualLeaveRoom(true);
      } else {
        setError(res.error || 'Failed to transfer privileges.');
      }
    });
  };

  const handleEndAndLeave = () => {
    actualLeaveRoom(true); // pass true to indicate we know what we are doing
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content leave-modal">
        <h3>Leave Room</h3>
        
        {isCreator ? (
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
                  <button className="btn btn-primary" onClick={handleTransferAndLeave}>
                    Transfer & Leave
                  </button>
                  <button className="btn btn-danger" onClick={handleEndAndLeave}>
                    End Game & Leave
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={handleEndAndLeave}>
                  End Game & Leave
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p>Are you sure you want to leave the room?</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => actualLeaveRoom(true)}>Yes, Leave</button>
            </div>
          </div>
        )}
        
        <button className="btn btn-ghost cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
