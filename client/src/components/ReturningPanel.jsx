import { useGame } from '../context/GameContext';

// Shown on the room screens while a saved seat is being claimed again after the app was reopened
// or the connection came back, instead of sending the player through the lobby.
export default function ReturningPanel() {
  const { actualLeaveRoom } = useGame();
  return (
    <div className="returning-panel" style={{ maxWidth: 420, margin: '48px auto', padding: '0 16px' }} role="status" aria-live="polite">
      <div className="side-panel">
        <span className="tag">Multiplayer</span>
        <h3 style={{ margin: '12px 0 6px' }}>Returning to your game</h3>
        <p className="side-empty">Picking up where you left off. This usually takes a moment.</p>
        <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button" style={{ marginTop: 12 }}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}
