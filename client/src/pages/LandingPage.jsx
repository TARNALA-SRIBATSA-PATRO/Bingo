import { useNavigate } from 'react-router-dom';
import SoundToggle from '../components/SoundToggle';
import { PlayIcon, BookIcon, UsersIcon, SparklesIcon, TrophyIcon } from '../components/Icons';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <SoundToggle className="sound-toggle-floating" />

      <div className="landing-content">
        <div className="logo-area">
          <div className="bingo-brand-logo" aria-label="BINGO">
            {'BINGO'.split('').map((letter, i) => (
              <span key={i} className="bingo-brand-letter" style={{ animationDelay: `${i * 0.08}s` }}>
                {letter}
              </span>
            ))}
          </div>

          <p className="tagline">The classic 5×5 number showdown — compete with friends in real-time!</p>
        </div>

        <div className="landing-buttons">
          <button
            className="btn btn-primary btn-large start-game-btn"
            onClick={() => navigate('/lobby')}
          >
            <PlayIcon size={20} className="btn-icon" />
            Play Now
          </button>
          <button
            className="btn btn-secondary btn-large rules-btn"
            onClick={() => navigate('/how-to-play')}
          >
            <BookIcon size={20} className="btn-icon" />
            How to Play
          </button>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon-bubble bubble-purple">
              <UsersIcon size={22} />
            </div>
            <div className="feature-info">
              <div className="feature-title">Private Rooms</div>
              <div className="feature-desc">Create or join rooms with a simple 6-digit code</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-cyan">
              <SparklesIcon size={22} />
            </div>
            <div className="feature-info">
              <div className="feature-title">Live Synchronized</div>
              <div className="feature-desc">Every call is instantly marked on everyone's board</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-gold">
              <TrophyIcon size={22} />
            </div>
            <div className="feature-info">
              <div className="feature-title">Victory Tracking</div>
              <div className="feature-desc">Multi-round series with all-time leaderboard wins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
