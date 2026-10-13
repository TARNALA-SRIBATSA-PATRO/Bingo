import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalContent from '../components/LegalContent';
import SoundToggle from '../components/SoundToggle';
import { ArrowLeftIcon } from '../components/Icons';
import './LegalPage.css';

export default function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <SoundToggle className="sound-toggle-floating" />

      <button 
        className="btn btn-secondary back-btn legal-back-btn" 
        onClick={() => navigate('/')}
        aria-label="Back to Home"
      >
        <ArrowLeftIcon size={18} />
        <span>Back to Bingo</span>
      </button>

      <main className="legal-page-container">
        <header className="legal-page-header">
          <div className="bingo-brand-logo" aria-label="BINGO">
            {'BINGO'.split('').map((letter, i) => (
              <span key={i} className="bingo-brand-letter" style={{ animationDelay: `${i * 0.08}s` }}>
                {letter}
              </span>
            ))}
          </div>
          <h1 className="legal-page-h1">Legal Terms &amp; Disclaimer</h1>
          <p className="legal-page-tagline">
            Official intellectual property rights, liability limitations, and acceptable use policy.
          </p>
        </header>

        <div className="legal-page-card">
          <LegalContent />
        </div>
      </main>
    </div>
  );
}
