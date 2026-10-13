import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { BotIcon, CheckIcon } from './Icons';
import { ALL_LINES, checkBingoLines } from '../utils/botEngine';
import './BotBoardModal.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

/** Measure SVG line coordinates from actual rendered bot board cells */
function computeLineCoords(containerEl, lineKey) {
  const cells = containerEl.querySelectorAll('.bot-cell');
  if (cells.length !== 25) return null;
  const gridRect = containerEl.getBoundingClientRect();

  const center = (r, c) => {
    const rect = cells[r * 5 + c].getBoundingClientRect();
    return {
      x: rect.left - gridRect.left + rect.width / 2,
      y: rect.top - gridRect.top + rect.height / 2,
    };
  };

  const EXTEND = 14; // px to extend beyond first/last cell center on modal board

  if (lineKey.startsWith('row-')) {
    const r = parseInt(lineKey.split('-')[1], 10);
    const s = center(r, 0); const e = center(r, 4);
    return { x1: s.x - EXTEND, y1: s.y, x2: e.x + EXTEND, y2: e.y };
  }
  if (lineKey.startsWith('col-')) {
    const c = parseInt(lineKey.split('-')[1], 10);
    const s = center(0, c); const e = center(4, c);
    return { x1: s.x, y1: s.y - EXTEND, x2: e.x, y2: e.y + EXTEND };
  }
  if (lineKey === 'diag-main') {
    const s = center(0, 0); const e = center(4, 4);
    const dx = EXTEND * Math.cos(Math.PI / 4);
    return { x1: s.x - dx, y1: s.y - dx, x2: e.x + dx, y2: e.y + dx };
  }
  if (lineKey === 'diag-anti') {
    const s = center(0, 4); const e = center(4, 0);
    const dx = EXTEND * Math.cos(Math.PI / 4);
    return { x1: s.x + dx, y1: s.y - dx, x2: e.x - dx, y2: e.y + dx };
  }
  return null;
}

export default function BotBoardModal({ 
  board, 
  markedCells = [], 
  bingoLines = [], 
  lastMove = null, 
  difficulty = 'pro', 
  onClose 
}) {
  const boardRef = useRef(null);
  const [lineCoords, setLineCoords] = useState({});
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  if (!board || !Array.isArray(board) || board.length !== 5) return null;

  // Normalized set of all marked numbers
  const markedSet = useMemo(() => {
    const set = new Set();
    (markedCells || []).forEach(n => set.add(Number(n)));
    if (lastMove !== null && lastMove !== undefined) {
      set.add(Number(lastMove));
    }
    return set;
  }, [markedCells, lastMove]);

  // Authoritative completed lines: combine passed bingoLines with recalculation on board
  const linesList = useMemo(() => {
    const detected = checkBingoLines(board, markedSet);
    const combined = new Set([...(bingoLines || []), ...detected]);
    return Array.from(combined);
  }, [board, markedSet, bingoLines]);

  const linesSet = useMemo(() => new Set(linesList), [linesList]);
  const completedLinesCount = Math.min(5, linesSet.size);

  // Compute which cells belong to completed lines
  const winningCells = useMemo(() => {
    const cells = new Set();
    for (const line of ALL_LINES) {
      if (linesSet.has(line.id)) {
        for (const [r, c] of line.cells) {
          cells.add(`${r}-${c}`);
        }
      }
    }
    return cells;
  }, [linesSet]);

  // Recalculate SVG cut line coordinates
  const updateCoords = useCallback(() => {
    if (!boardRef.current || linesList.length === 0) {
      setLineCoords({});
      return;
    }
    const el = boardRef.current;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setSvgSize({ w: rect.width, h: rect.height });

    const coords = {};
    for (const lineKey of linesList) {
      const c = computeLineCoords(el, lineKey);
      if (c) coords[lineKey] = c;
    }
    setLineCoords(coords);
  }, [linesList]);

  useEffect(() => {
    updateCoords();
    const raf = requestAnimationFrame(updateCoords);
    const t1 = setTimeout(updateCoords, 60);
    const t2 = setTimeout(updateCoords, 200);
    const t3 = setTimeout(updateCoords, 350);

    let ro;
    if (typeof ResizeObserver !== 'undefined' && boardRef.current) {
      ro = new ResizeObserver(() => updateCoords());
      ro.observe(boardRef.current);
    }

    window.addEventListener('resize', updateCoords);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateCoords);
    };
  }, [updateCoords]);

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
              Completed {linesSet.size} line{linesSet.size === 1 ? '' : 's'} • {lastMove ? `Last move: #${lastMove}` : '100% fair play verified'}
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

        {/* 5x5 Board Grid with Cut Lines Overlay */}
        <div className="bot-grid-wrapper">
          <div className="bot-board-container" ref={boardRef}>
            <div className="bot-board-grid">
              {board.map((row, r) => (
                <div key={r} className="bot-board-row">
                  {row.map((val, c) => {
                    const numVal = Number(val);
                    const isMarked = markedSet.has(numVal);
                    const isWinning = winningCells.has(`${r}-${c}`);
                    const isLastMove = lastMove !== null && lastMove !== undefined && Number(lastMove) === numVal;
                    return (
                      <div
                        key={c}
                        className={[
                          'bot-cell',
                          isMarked ? 'marked' : '',
                          isWinning ? 'winning-line-cell' : '',
                          isLastMove ? 'last-move-cell' : ''
                        ].filter(Boolean).join(' ')}
                      >
                        <span className="bot-cell-num">{val}</span>
                        {isLastMove && <span className="bot-cell-last-badge">LAST</span>}
                        {isMarked && !isLastMove && <span className="bot-cell-mark-indicator" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Continuous SVG cut lines for bot's completed rows/cols/diagonals */}
            {Object.keys(lineCoords).length > 0 && (
              <svg
                className="bot-board-lines-svg"
                width={svgSize.w}
                height={svgSize.h}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
              >
                {Object.entries(lineCoords).map(([key, { x1, y1, x2, y2 }]) => (
                  <line
                    key={key}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                ))}
              </svg>
            )}
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
