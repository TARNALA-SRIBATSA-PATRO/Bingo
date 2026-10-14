import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import ConfirmModal from './ConfirmModal';

export default function BackNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showLeaveModal, setShowLeaveModal } = useGame();
  const [modalConfig, setModalConfig] = useState(null);

  // Set up history guard to catch hardware/software/gesture Back button
  useEffect(() => {
    // Push initial guard state into browser history stack
    window.history.pushState({ bingoGuard: true }, '');

    const handlePopState = (e) => {
      // Re-push guard state immediately to continue intercepting subsequent back actions
      window.history.pushState({ bingoGuard: true }, '');

      // 1. If any leave/exit modal is already open, close it on back
      if (showLeaveModal) {
        setShowLeaveModal(false);
        return;
      }
      if (modalConfig) {
        setModalConfig(null);
        return;
      }

      const pathname = window.location.pathname;

      // 2. In Match or Board Setup (/game, /board-setup)
      if (pathname === '/game' || pathname === '/board-setup') {
        setShowLeaveModal(true);
        return;
      }

      // 3. In Game Arena / Lobby (/lobby)
      if (pathname === '/lobby') {
        // First check if a sub-mode form (bot difficulty, create room, or join code) is active
        const event = new CustomEvent('bingo:lobby-back', { cancelable: true });
        const handledByLobby = !window.dispatchEvent(event);
        if (handledByLobby) {
          // Lobby returned from form back to mode selection
          return;
        }

        // On main lobby screen: ask confirmation to return to Home
        setModalConfig({
          title: 'Return to Home?',
          message: 'Are you sure you want to leave the Game Arena and return to the main menu?',
          confirmText: 'Return Home',
          cancelText: 'Stay in Arena',
          confirmVariant: 'danger',
          onConfirm: () => {
            setModalConfig(null);
            navigate('/');
          }
        });
        return;
      }

      // 4. In How to Play or Legal Info
      if (pathname === '/how-to-play' || pathname === '/legal') {
        navigate('/');
        return;
      }

      // 5. On Home / Landing Page (/)
      if (pathname === '/') {
        setModalConfig({
          title: 'Exit Bingo?',
          message: 'Are you sure you want to leave the app? You can return anytime to play!',
          confirmText: 'Exit App',
          cancelText: 'Stay & Play',
          confirmVariant: 'danger',
          onConfirm: () => {
            setModalConfig(null);
            // Allow history to navigate back out of app
            window.history.go(-2);
            setTimeout(() => {
              try { window.close(); } catch {}
            }, 150);
          }
        });
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, showLeaveModal, setShowLeaveModal, modalConfig, navigate]);

  return (
    <ConfirmModal
      isOpen={Boolean(modalConfig)}
      title={modalConfig?.title}
      message={modalConfig?.message}
      confirmText={modalConfig?.confirmText}
      cancelText={modalConfig?.cancelText}
      confirmVariant={modalConfig?.confirmVariant}
      onConfirm={modalConfig?.onConfirm}
      onCancel={() => setModalConfig(null)}
    />
  );
}
