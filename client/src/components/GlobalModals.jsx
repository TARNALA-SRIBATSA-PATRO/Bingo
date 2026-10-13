import { useGame } from '../context/GameContext';
import LeaveModal from './LeaveModal';
import GameOverModal from './GameOverModal';
import ShareModal from './ShareModal';
import PwaNamePromptModal from './PwaNamePromptModal';
import InactivityWarningModal from './InactivityWarningModal';

export default function GlobalModals() {
  const { showLeaveModal, setShowLeaveModal, gameOver, shareModalData, setShareModalData } = useGame();
  
  return (
    <>
      <PwaNamePromptModal />
      <InactivityWarningModal />
      {showLeaveModal && <LeaveModal onClose={() => setShowLeaveModal(false)} />}
      {gameOver && <GameOverModal />}
      {shareModalData && <ShareModal data={shareModalData} onClose={() => setShareModalData(null)} />}
    </>
  );
}
