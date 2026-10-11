import { useNavigate } from 'react-router-dom';
import SoundToggle from '../components/SoundToggle';
import {
  ArrowLeftIcon,
  UsersIcon,
  ShuffleIcon,
  CrosshairIcon,
  CheckIcon,
  TrophyIcon,
  PlayIcon,
  CopyIcon,
  CrownIcon,
  RefreshIcon
} from '../components/Icons';
import './HowToPlay.css';

const steps = [
  {
    icon: <UsersIcon size={20} />,
    title: 'Create or Join a Room',
    desc: 'One player creates a room and shares the unique 6-character room code. Friends enter the code under "Join with Code" to enter the lobby. Each player is automatically assigned a distinct player color and display avatar.',
    visual: (
      <div className="htp-visual room-visual">
        <div className="htp-room-code-pill">
          <span className="code-label">Room Code</span>
          <span className="code-value">ABCD12</span>
          <CopyIcon size={14} className="code-copy-icon" />
        </div>
        <div className="htp-players-row">
          <div className="htp-player-chip chip-purple">
            <CrownIcon size={13} className="host-crown" />
            <span>Alex (Host)</span>
          </div>
          <div className="htp-player-chip chip-cyan">
            <span>Sam</span>
          </div>
          <div className="htp-player-chip chip-emerald">
            <span>Jordan</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: <ShuffleIcon size={20} />,
    title: 'Fill Your 5×5 Board',
    desc: 'Every player fills their own private 5×5 grid with numbers 1 through 25 (no duplicates). You can click cells sequentially, place numbers in Manual Mode, or tap Auto-Fill for instant random placement. Once full, click "Confirm & Lock Board".',
    visual: (
      <div className="htp-visual board-setup-visual">
        <div className="htp-mini-grid">
          {[14, 7, 22, 3, 19, 11, 25, 1, 16, 8, 4, 20, 13, 6, 24, 17, 9, 2, 21, 12, 5, 15, 18, 10, 23].map((n, i) => (
            <div key={i} className={`htp-setup-cell ${i === 7 || i === 15 ? 'highlight' : ''}`}>
              {n}
            </div>
          ))}
        </div>
        <div className="htp-setup-actions">
          <span className="setup-badge-action"><ShuffleIcon size={13} /> Auto-Fill</span>
          <span className="setup-badge-locked"><CheckIcon size={13} /> Locked (25/25)</span>
        </div>
      </div>
    )
  },
  {
    icon: <CrosshairIcon size={20} />,
    title: 'Take Turns Calling Numbers',
    desc: 'Players take turns calling numbers. When it\'s your turn, the top banner displays "Your Turn — Select a Number". Tap any unmarked number on your board. That number is immediately called and stamped on every player\'s board with your caller color!',
    visual: (
      <div className="htp-visual turn-visual">
        <div className="htp-turn-banner">
          <CrosshairIcon size={15} />
          <span>Your Turn — Select a Number</span>
        </div>
        <div className="htp-call-preview-row">
          <div className="htp-call-cell caller-alex">17</div>
          <span className="htp-call-arrow">→</span>
          <div className="htp-call-marked-demo">
            <span className="caller-tag tag-purple">Alex called 17</span>
            <span className="caller-tag-sub">Stamped on all boards</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: <CheckIcon size={20} />,
    title: 'Complete 5 Lines to Light Up B-I-N-G-O',
    desc: 'Complete horizontal rows, vertical columns, or corner-to-corner diagonals. Each completed line strikes through your board and lights up the next golden letter in your B-I-N-G-O tracker! Unlocking all 5 golden letters wins the match.',
    visual: (
      <div className="htp-visual bingo-visual">
        <div className="htp-bingo-tracker">
          {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
            <div key={letter} className={`htp-track-letter ${i < 3 ? 'lit' : ''}`}>
              {letter}
            </div>
          ))}
        </div>
        <div className="htp-line-status">
          <div className="line-item done">✓ Row 2 Complete → <span className="gold-text">B Lit</span></div>
          <div className="line-item done">✓ Column 4 Complete → <span className="gold-text">I Lit</span></div>
          <div className="line-item done">✓ Diagonal Complete → <span className="gold-text">N Lit</span></div>
          <div className="line-item pending">⚡ 2 more lines needed for G & O!</div>
        </div>
      </div>
    )
  },
  {
    icon: <TrophyIcon size={20} />,
    title: 'Claim Victory & Play Series',
    desc: 'The first player to light up all 5 letters triggers BINGO Victory! A victory podium announces the winner. The room host can launch instant rematches in the same room, with cumulative win counts tracked across rounds.',
    visual: (
      <div className="htp-visual win-visual">
        <div className="htp-win-badge">
          <TrophyIcon size={20} className="trophy-gold" />
          <span>BINGO Victory! Alex Wins</span>
        </div>
        <div className="htp-series-card">
          <span className="series-title">Series Leaderboard</span>
          <div className="series-scores">
            <span className="score-item leader">👑 Alex: 2 Wins</span>
            <span className="score-item">Sam: 1 Win</span>
            <span className="score-item">Jordan: 0 Wins</span>
          </div>
        </div>
        <div className="htp-rematch-pill">
          <RefreshIcon size={14} />
          <span>Host Launches Rematch (Round #3)</span>
        </div>
      </div>
    )
  }
];

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="htp-page">
      <SoundToggle className="sound-toggle-floating" />

      <div className="htp-header">
        <button className="btn btn-ghost back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>
        <h1>How to Play <span className="accent">Bingo</span></h1>
        <p className="htp-subtitle">The rules of the 5×5 multiplayer battle in 5 simple steps</p>
      </div>

      <div className="htp-steps">
        {steps.map((step, i) => (
          <div key={i} className="htp-step-card">
            <div className="htp-step-header">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon-wrap">{step.icon}</div>
              <h2>{step.title}</h2>
            </div>
            <div className="htp-step-body">
              <p>{step.desc}</p>
              <div className="htp-step-visual">{step.visual}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="htp-footer">
        <button className="btn btn-primary btn-large" onClick={() => navigate('/lobby')}>
          <PlayIcon size={20} className="btn-icon" />
          Start Playing Now
        </button>
      </div>
    </div>
  );
}
