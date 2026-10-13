import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './InactivityWarningModal.css';

export default function InactivityWarningModal() {
  const { inactivityWarning, keepRoomAlive, deleteRoomNow } = useGame() || {};
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!inactivityWarning) {
      setSecondsLeft(10);
      return;
    }

    const initial = typeof inactivityWarning.countdown === 'number' ? inactivityWarning.countdown : 10;
    setSecondsLeft(initial);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inactivityWarning]);

  if (!inactivityWarning) return null;

  return (
    <div 
      className="inactivity-modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      aria-describedby="inactivity-desc"
    >
      <div className="inactivity-modal-card">
        <div className="inactivity-pulse-circle">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h3 id="inactivity-title" className="inactivity-title">
          Room Inactivity Warning
        </h3>
        
        <p id="inactivity-desc" className="inactivity-desc">
          You are currently the only player in this room and no activity was detected.
        </p>

        <div className="inactivity-countdown-box">
          <span className="inactivity-countdown-label">Deleting room in</span>
          <span className="inactivity-timer-num">{secondsLeft}s</span>
          <div className="inactivity-progress-track">
            <div 
              className="inactivity-progress-fill" 
              style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / 10) * 100))}%` }}
            />
          </div>
        </div>

        <div className="inactivity-actions">
          <button 
            type="button" 
            className="btn btn-primary inactivity-keep-btn"
            onClick={keepRoomAlive}
            autoFocus
          >
            Do Not Delete (Keep Room Open)
          </button>
          
          <button 
            type="button" 
            className="btn btn-ghost inactivity-delete-btn"
            onClick={deleteRoomNow}
          >
            Delete &amp; Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
