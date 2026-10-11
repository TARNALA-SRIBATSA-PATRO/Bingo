import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SoundToggle from '../components/SoundToggle';
import {
  PlayIcon,
  BookIcon,
  UsersIcon,
  SparklesIcon,
  TrophyIcon,
  ShieldIcon,
  ZapIcon,
  VolumeMuteIcon
} from '../components/Icons';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="landing-page">
      <SoundToggle className="sound-toggle-floating" />

      <main className="landing-content">
        <header className="logo-area">
          <div className="bingo-brand-logo" aria-label="BINGO">
            {'BINGO'.split('').map((letter, i) => (
              <span key={i} className="bingo-brand-letter" style={{ animationDelay: `${i * 0.08}s` }}>
                {letter}
              </span>
            ))}
          </div>

          <h1 className="landing-h1">Free Online Multiplayer Bingo</h1>
          <p className="tagline">
            The classic 5×5 number game to play live with friends. 100% free, zero ads, no login or download required!
          </p>
        </header>

        <nav className="landing-buttons" aria-label="Game navigation">
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
        </nav>

        {/* Feature Highlights Grid */}
        <section className="landing-features" aria-label="Game Features">
          <div className="feature-card">
            <div className="feature-icon-bubble bubble-purple">
              <UsersIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">Private Rooms & Easy Share</h2>
              <p className="feature-desc">Create 6-digit rooms and invite friends via link or WhatsApp instantly.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-green">
              <ZapIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">100% Free & No Ads</h2>
              <p className="feature-desc">Pure, uninterrupted gameplay with zero advertisements or payment walls.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-blue">
              <ShieldIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">No Login or Download</h2>
              <p className="feature-desc">No accounts, passwords, or app installations. Just choose a name and play.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-cyan">
              <SparklesIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">Live Synchronized Turns</h2>
              <p className="feature-desc">Fast real-time WebSockets keep every board and number call in perfect sync.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-gold">
              <TrophyIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">Track Older Winners</h2>
              <p className="feature-desc">Round-by-round game history and all-time leaderboard track every champion.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble bubble-rose">
              <VolumeMuteIcon size={22} />
            </div>
            <div className="feature-info">
              <h2 className="feature-title">Default Mute Music</h2>
              <p className="feature-desc">Audio is muted by default for quiet browsing, with a convenient sound toggle.</p>
            </div>
          </div>
        </section>

        {/* SEO FAQ & Quick Info Accordion */}
        <section className="landing-seo-section" aria-label="Frequently Asked Questions">
          <button
            className="seo-toggle-btn"
            onClick={() => setShowFaq(!showFaq)}
            aria-expanded={showFaq}
          >
            <span>{showFaq ? 'Hide FAQ & Game Details ▲' : 'Frequently Asked Questions & Game Guide ▼'}</span>
          </button>

          {showFaq && (
            <div className="seo-faq-content">
              <article className="seo-faq-item">
                <h3>Is this Bingo game completely free of cost?</h3>
                <p>Yes! It is 100% free with no in-app purchases, hidden fees, or advertisements.</p>
              </article>

              <article className="seo-faq-item">
                <h3>Do I need an account or login to play?</h3>
                <p>No login or registration is required. You can jump directly into a lobby by simply entering a nickname.</p>
              </article>

              <article className="seo-faq-item">
                <h3>How do I play with friends online?</h3>
                <p>Click "Play Now" to create a private room. You'll receive a 6-digit room code and a share link that your friends can open on their mobile phone, tablet, or desktop browser.</p>
              </article>

              <article className="seo-faq-item">
                <h3>How are previous winners tracked?</h3>
                <p>The game tracks round-by-round winners in the match history panel, keeping an all-time victory count for all players throughout the session.</p>
              </article>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
