import React, { useState, useEffect } from 'react';
import { 
  isStandaloneApp, 
  getPersistentPlayerName, 
  setPersistentPlayerName, 
  isNamePromptDeclined, 
  setNamePromptDeclined 
} from '../utils/storageUtils';
import { useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './PwaNamePromptModal.css';

export default function PwaNamePromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setPlayerName, showNotif } = useGame() || {};
  const { pathname } = useLocation();
  // Only ask on the home page or in the lobby; never interrupt setup or a round.
  const onQuietPage = pathname === '/' || pathname === '/lobby';

  useEffect(() => {
    let isMounted = true;

    async function checkEligibility() {
      // Must be running in standalone/installed app mode
      const standalone = isStandaloneApp();
      if (!standalone) return;

      // If already has a persistent name, do not prompt
      const existingName = await getPersistentPlayerName();
      if (existingName && existingName.trim()) {
        if (setPlayerName) setPlayerName(existingName.trim());
        return;
      }

      // If already declined, leave it
      const declined = await isNamePromptDeclined();
      if (declined) return;

      if (isMounted) {
        setIsOpen(true);
      }
    }

    checkEligibility();

    // Also trigger if app gets installed during current session
    const handleAppInstalled = async () => {
      const existingName = await getPersistentPlayerName();
      const declined = await isNamePromptDeclined();
      if (!existingName && !declined && isMounted) {
        setIsOpen(true);
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      isMounted = false;
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setPlayerName]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) {
      setError('Please enter a display name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await setPersistentPlayerName(clean);
      if (setPlayerName) setPlayerName(clean);
      if (showNotif) showNotif(`Name saved as ${clean}.`, 'success', 3500);
      setIsOpen(false);
    } catch (err) {
      console.error('Error saving name:', err);
      setError('Could not save name. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await setNamePromptDeclined();
    } catch (err) {
      console.error('Error recording decline:', err);
    }
    setIsOpen(false);
  };

  if (!isOpen || !onQuietPage) return null;

  return (
    <div 
      className="pwa-name-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-name-title"
    >
      <div className="pwa-name-card" onClick={(e) => e.stopPropagation()}>
        <button 
          className="pwa-name-close-btn" 
          onClick={handleDecline}
          aria-label="Decline and close"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="pwa-name-icon-wrap">
          <div className="pwa-name-avatar-glow">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <h3 id="pwa-name-title" className="pwa-name-title">
          Set your name
        </h3>
        <p className="pwa-name-subtitle">
          It will be filled in whenever you make or join a room.
        </p>

        <form onSubmit={handleSave} className="pwa-name-form">
          <div className="pwa-name-input-group">
            <input 
              type="text" 
              className="pwa-name-input"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              maxLength={20}
              autoFocus
              aria-label="Display name"
            />
            {error && <span className="pwa-name-error">{error}</span>}
          </div>

          <div className="pwa-name-actions">
            <button 
              type="submit" 
              className="btn btn-primary pwa-name-save-btn"
              disabled={submitting}
            >
              {submitting ? 'Saving' : 'Save name'}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost pwa-name-skip-btn"
              onClick={handleDecline}
              disabled={submitting}
            >
              Not Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
