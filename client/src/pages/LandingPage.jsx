import { useNavigate } from 'react-router-dom';
import TopActions from '../components/TopActions';
import { PlayIcon, BookIcon } from '../components/Icons';
import './LandingPage.css';

const FAQ = [
  { q: 'Does it cost anything?', a: 'No. There are no purchases, subscriptions or ads.' },
  { q: 'Do I need an account?', a: 'No. Type a name, make a room and share the code.' },
  { q: 'How do I play with friends?', a: 'One person creates a room and gets a 6-character code and a link. Everyone else enters the code or opens the link. Up to 4 people can be in a room.' },
  { q: 'Can I play on my own?', a: 'Yes. Pick "Play against the bot" in the lobby. It works offline once the page has loaded.' },
  { q: 'Does it keep score?', a: 'Each room keeps a list of who won each round and a running win count while the room is open.' }
];

// A finished-looking card for the hero: two players' marks and one completed row.
const HERO_CARD = [
  [14, 7, 22, 3, 19],
  [11, 25, 1, 16, 8],
  [4, 20, 13, 6, 24],
  [17, 9, 2, 21, 12],
  [5, 15, 18, 10, 23]
];
const CORAL = '#e8775d';
const SKY = '#5fb3e6';
const MARKS = { 14: CORAL, 7: SKY, 22: CORAL, 3: SKY, 19: CORAL, 25: SKY, 13: CORAL, 9: SKY, 21: CORAL, 18: SKY, 6: CORAL };

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <TopActions />

      <main className="landing-content">
        <section className="hero">
          <div className="hero-text">
            <div className="brand" aria-label="Bingo">
              {'BINGO'.split('').map((letter) => (
                <span key={letter} className="brand-tile">{letter}</span>
              ))}
            </div>
            <h1 className="landing-h1">Bingo with friends, in the browser</h1>
            <p className="landing-lead">
              Fill a 5×5 card, take turns calling numbers, first to five lines wins.
              Up to four players, or the bot. No sign-up.
            </p>
            <div className="landing-buttons">
              <button className="btn btn-primary btn-large" onClick={() => navigate('/lobby')}>
                <PlayIcon size={18} />
                Play
              </button>
              <button className="btn btn-secondary btn-large" onClick={() => navigate('/how-to-play')}>
                <BookIcon size={18} />
                How to play
              </button>
            </div>
          </div>

          <div className="hero-card" aria-hidden="true">
            <div className="hero-letters">
              {['B', 'I', 'N', 'G', 'O'].map((l, i) => (
                <span key={l} className={i < 1 ? 'lit' : ''}>{l}</span>
              ))}
            </div>
            <div className="hero-grid">
              {HERO_CARD.flat().map((n) => (
                <span key={n} className={`hero-cell ${MARKS[n] ? 'marked' : ''}`} style={MARKS[n] ? { '--caller': MARKS[n] } : undefined}>
                  {n}
                </span>
              ))}
              <span className="hero-line" />
            </div>
            <div className="hero-call">
              <span className="hero-ball" style={{ '--ball': CORAL }}>6</span>
              <span className="hero-call-text">
                <strong>Alex called 6</strong>
                <span>Row 1 complete</span>
              </span>
            </div>
          </div>
        </section>

        <section className="landing-steps" aria-label="How it works">
          <ol>
            <li>
              <span className="step-num">1</span>
              <div>
                <strong>Make a room</strong>
                <p>Share the 6-character code or the link.</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Arrange your card</strong>
                <p>Place 1 to 25 however you like, or shuffle.</p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Call numbers in turn</strong>
                <p>Every call is marked on every card. Five lines wins.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="landing-faq" aria-label="Questions">
          <h2 className="eyebrow">Questions</h2>
          {FAQ.map(({ q, a }) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>
    </div>
  );
}
