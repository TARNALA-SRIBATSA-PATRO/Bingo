import { useNavigate } from 'react-router-dom';
import TopActions from '../components/TopActions';
import { ArrowLeftIcon, PlayIcon, CopyIcon, CrownIcon, ShuffleIcon, CheckIcon, CrosshairIcon, TrophyIcon, RefreshIcon } from '../components/Icons';
import './HowToPlay.css';

const SAMPLE_CARD = [14, 7, 22, 3, 19, 11, 25, 1, 16, 8, 4, 20, 13, 6, 24, 17, 9, 2, 21, 12, 5, 15, 18, 10, 23];

const steps = [
  {
    title: 'Make or join a room',
    desc: 'One player creates a room and shares its 6-character code or link. Others enter the code to join. Each player gets a colour that marks the numbers they call.',
    visual: (
      <div className="htp-visual">
        <div className="htp-code">
          <span className="eyebrow">Room</span>
          <span className="htp-code-value">ABCD12</span>
          <CopyIcon size={14} />
        </div>
        <div className="htp-chips">
          <span className="htp-chip" style={{ '--chip': '#e8775d' }}><CrownIcon size={12} /> Alex</span>
          <span className="htp-chip" style={{ '--chip': '#5fb3e6' }}>Sam</span>
          <span className="htp-chip" style={{ '--chip': '#63cfa3' }}>Jordan</span>
        </div>
      </div>
    )
  },
  {
    title: 'Arrange your card',
    desc: 'Place the numbers 1 to 25 on your own 5×5 card, each once. Tap empty cells to fill them in order, type numbers in manual mode, or shuffle a random card. Then submit it.',
    visual: (
      <div className="htp-visual">
        <div className="htp-grid">
          {SAMPLE_CARD.map((n, i) => (
            <div key={n} className={`htp-cell ${i === 7 || i === 15 ? 'hi' : ''}`}>{n}</div>
          ))}
        </div>
        <div className="htp-row">
          <span className="tag"><ShuffleIcon size={12} /> Shuffle</span>
          <span className="tag tag-ok"><CheckIcon size={12} /> 25 of 25</span>
        </div>
      </div>
    )
  },
  {
    title: 'Take turns calling numbers',
    desc: 'On your turn, tap an unmarked number on your card and confirm. That number is marked on every card in the room, in your colour.',
    visual: (
      <div className="htp-visual">
        <div className="htp-turn"><CrosshairIcon size={14} /> Your turn</div>
        <div className="htp-row">
          <div className="htp-call" style={{ '--chip': '#e8775d' }}>17</div>
          <div className="htp-call-text">
            <strong>Alex called 17</strong>
            <span>Marked on every card</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Complete five lines',
    desc: 'A full row, column or diagonal is a line. Each line lights the next letter of B-I-N-G-O on your card. Five lines wins the round.',
    visual: (
      <div className="htp-visual">
        <div className="htp-letters">
          {['B', 'I', 'N', 'G', 'O'].map((l, i) => (
            <span key={l} className={`htp-letter ${i < 3 ? 'lit' : ''}`}>{l}</span>
          ))}
        </div>
        <ul className="htp-lines">
          <li className="done">Row 2</li>
          <li className="done">Column 4</li>
          <li className="done">Diagonal</li>
          <li>Two more lines for G and O</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Play another round',
    desc: 'When someone reaches five lines the round ends. The host can start another round in the same room, and win counts carry over. If two players finish on the same call, the round is a draw.',
    visual: (
      <div className="htp-visual">
        <div className="htp-win"><TrophyIcon size={16} /> Alex wins round 2</div>
        <div className="htp-scores">
          <span className="eyebrow">Wins</span>
          <div className="htp-row">
            <span className="lead">Alex 2</span>
            <span>Sam 1</span>
            <span>Jordan 0</span>
          </div>
        </div>
        <span className="tag"><RefreshIcon size={12} /> Host starts round 3</span>
      </div>
    )
  }
];

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="htp-page">
      <TopActions />

      <header className="htp-header">
        <button className="btn btn-ghost back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>
        <h1>How to play</h1>
        <p>Five short steps. A round usually takes five to ten minutes.</p>
      </header>

      <ol className="htp-steps">
        {steps.map((step, i) => (
          <li key={step.title} className="htp-step">
            <div className="htp-step-head">
              <span className="step-num">{i + 1}</span>
              <h2>{step.title}</h2>
            </div>
            <div className="htp-step-body">
              <p>{step.desc}</p>
              {step.visual}
            </div>
          </li>
        ))}
      </ol>

      <div className="htp-footer">
        <button className="btn btn-primary btn-large" onClick={() => navigate('/lobby')}>
          <PlayIcon size={18} />
          Play
        </button>
      </div>
    </div>
  );
}
