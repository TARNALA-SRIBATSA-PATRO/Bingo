import { useNavigate } from 'react-router-dom';
import SoundToggle from '../components/SoundToggle';
import { PlayIcon, BookIcon } from '../components/Icons';
import './LandingPage.css';

const FAQ = [
  {
    q: 'Does it cost anything?',
    a: 'No. There are no purchases, subscriptions or ads.'
  },
  {
    q: 'Do I need an account?',
    a: 'No. Type a name, make a room and share the code.'
  },
  {
    q: 'How do I play with friends?',
    a: 'One person creates a room and gets a 6-character code and a link. Everyone else enters the code or opens the link. Up to 4 people can be in a room.'
  },
  {
    q: 'Can I play on my own?',
    a: 'Yes. Pick "Play against the bot" in the lobby. It works offline once the page has loaded.'
  },
  {
    q: 'Does it keep score?',
    a: 'Each room keeps a list of who won each round and a running win count while the room is open.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <SoundToggle className="sound-toggle-floating" />

      <main className="landing-content">
        <header className="landing-header">
          <div className="brand lg" aria-label="Bingo">
            {'BINGO'.split('').map((letter) => (
              <span key={letter} className="brand-tile">{letter}</span>
            ))}
          </div>
          <h1 className="landing-h1">Multiplayer bingo for a few friends</h1>
          <p className="landing-lead">
            Fill a 5×5 card with the numbers 1 to 25, then take turns calling them. First to five lines wins.
            Plays in the browser, no sign-up.
          </p>
        </header>

        <nav className="landing-buttons" aria-label="Start">
          <button className="btn btn-primary btn-large" onClick={() => navigate('/lobby')}>
            <PlayIcon size={18} />
            Play
          </button>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/how-to-play')}>
            <BookIcon size={18} />
            How to play
          </button>
        </nav>

        <section className="landing-steps" aria-label="How it works">
          <ol>
            <li>
              <span className="step-num">1</span>
              <div>
                <strong>Make a room</strong>
                <p>Share the 6-character code or the link. Up to 4 players.</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Arrange your card</strong>
                <p>Place 1 to 25 however you like, or let the game shuffle them.</p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Take turns calling</strong>
                <p>Every call is marked on every card. Rows, columns and diagonals light up B-I-N-G-O.</p>
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
