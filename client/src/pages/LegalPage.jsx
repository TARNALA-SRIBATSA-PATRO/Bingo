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

      <button className="btn btn-ghost back-btn legal-back-btn" onClick={() => navigate('/')}>
        <ArrowLeftIcon size={16} />
        <span>Back</span>
      </button>

      <main className="legal-page-container">
        <header className="legal-page-header">
          <div className="brand" aria-label="Bingo">
            {'BINGO'.split('').map((letter) => (
              <span key={letter} className="brand-tile">{letter}</span>
            ))}
          </div>
          <h1 className="legal-page-h1">Terms and disclaimer</h1>
          <p className="legal-page-tagline">Who owns what, what we are not responsible for, and how the game may be used.</p>
        </header>

        <div className="legal-page-card">
          <LegalContent />
        </div>
      </main>
    </div>
  );
}
