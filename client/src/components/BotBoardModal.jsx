import React from 'react';
import { BotIcon, CheckIcon } from './Icons';
import { ALL_LINES } from '../utils/botEngine';
import './BotBoardModal.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export default function BotBoardModal({ board, markedCells = [], bingoLines = [], difficulty = 'pro', onClose }) {
  if (!board || !Array.isArray(board) || board.length !== 5) return null;

  const markedSet = new Set(markedCells || []);
  const linesSet = new Set(bingoLines || []);
  const completedLinesCount = Math.min(5, linesSet.size);

  // Compute which cells belong to completed lines
  const winningCells = new Set();
  for (const line of ALL_LINES) {
    if (linesSet.has(line.id)) {
      for (const [r, c] of line.cells) {
        winningCells.add(`${r}-${c}`);
      }
    }
  }

  const difficultyLabels = {
    beginner: 'Beginner AI',
    intermediate: 'Intermediate AI',
    pro: 'Pro Master AI'
  };

  return (
    <div className="modal-overlay bot-board-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content bot-board-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bot-board-header">
          <div className="bot-avatar-badge">
            <BotIcon size={24} className="bot-avatar-svg" />
          </div>
          <div className="bot-header-titles">
            <div className="bot-title-row">
              <h3>BingoBot's Board</h3>
              <span className={`difficulty-pill difficulty-${difficulty}`}>
                {difficultyLabels[difficulty] || 'Pro AI'}
              </span>
            </div>
            <p className="bot-header-sub">
              Completed {linesSet.size} line{linesSet.size === 1 ? '' : 's'} • 100% fair play verified
            </p>
          </div>
        </div>

        {/* B-I-N-G-O Letters Status */}
        <div className="bot-letters-strip">
          {BINGO_LETTERS.map((letter, i) => {
            const isEarned = i < completedLinesCount;
            return (
              <div key={letter} className={`bot-bingo-letter ${isEarned ? 'earned' : ''}`}>
                <span>{letter}</span>
                {isEarned && <span className="letter-check-dot"><CheckIcon size={10} /></span>}
              </div>
            );
          })}
        </div>

        {/* 5x5 Board Grid */}
        <div className="bot-grid-wrapper">
          <div className="bot-board-grid">
            {board.map((row, r) => (
              <div key={r} className="bot-board-row">
                {row.map((val, c) => {
                  const isMarked = markedSet.has(val);
                  const isWinning = winningCells.has(`${r}-${c}`);
                  return (
                    <div
                      key={c}
                      className={`bot-cell ${isMarked ? 'marked' : ''} ${isWinning ? 'winning-line-cell' : ''}`}
                    >
                      <span className="bot-cell-num">{val}</span>
                      {isMarked && <span className="bot-cell-mark-indicator" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Fairness Guarantee Note */}
        <div className="bot-fairness-note">
          <span className="fairness-shield-icon">🛡️</span>
          <span>
            Bot made decisions strictly using its own board and called history. It had zero access to your board.
          </span>
        </div>

        {/* Close Action */}
        <button className="btn btn-primary bot-modal-close-btn" onClick={onClose} type="button">
          Close Preview
        </button>

      </div>
    </div>
  );
}
