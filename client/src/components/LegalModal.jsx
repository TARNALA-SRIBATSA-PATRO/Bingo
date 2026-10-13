import React, { useEffect } from 'react';
import LegalContent from './LegalContent';
import './LegalModal.css';

export default function LegalModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="legal-modal-overlay" 
      onClick={onClose}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="legal-modal-title"
    >
      <div 
        className="legal-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="legal-modal-header">
          <div className="legal-modal-title-wrap">
            <svg 
              className="legal-modal-icon" 
              viewBox="0 0 24 24" 
              width="22" 
              height="22" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h2 id="legal-modal-title">Legal &amp; Disclaimer</h2>
          </div>
          <button 
            className="legal-modal-close-btn" 
            onClick={onClose}
            aria-label="Close legal modal"
          >
            ✕
          </button>
        </header>

        <div className="legal-modal-body">
          <LegalContent />
        </div>

        <footer className="legal-modal-footer">
          <button 
            className="btn btn-secondary legal-close-action-btn" 
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
