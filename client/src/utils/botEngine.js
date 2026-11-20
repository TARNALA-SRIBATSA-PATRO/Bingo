/**
 * botEngine.js
 * Bot opponent for single-player rounds.
 *
 * Difficulty levels:
 * - 'beginner': mostly random calls, sometimes finishes a line that is one away.
 * - 'intermediate': the learned policy below, with 35% random calls mixed in.
 * - 'pro': the learned policy, always its best call.
 *
 * The learned policy is a linear value function over hand-made features of the bot's own card
 * (see POLICY_FEATURES). Its weights live in botPolicy.json and are trained offline by
 * tools/train-bot.mjs through self-play; tools/eval-bot.mjs measures it. No network, no runtime
 * dependency: picking a move is a few thousand integer operations.
 *
 * Fairness: the bot never reads the player's card. Every decision uses only the bot's own card,
 * the public list of called numbers and the weights file.
 *
 * All functions here are pure. Anything random takes an optional `rng` (a () => number in [0, 1))
 * so the training scripts can seed it; the game passes nothing and gets Math.random.
 */
import botPolicy from './botPolicy.json' with { type: 'json' };

// All 12 possible Bingo lines on a 5x5 board
export const ALL_LINES = [
  // 5 Rows
  { id: 'row-0', cells: [[0,0], [0,1], [0,2], [0,3], [0,4]] },
  { id: 'row-1', cells: [[1,0], [1,1], [1,2], [1,3], [1,4]] },
  { id: 'row-2', cells: [[2,0], [2,1], [2,2], [2,3], [2,4]] },
  { id: 'row-3', cells: [[3,0], [3,1], [3,2], [3,3], [3,4]] },
  { id: 'row-4', cells: [[4,0], [4,1], [4,2], [4,3], [4,4]] },

  // 5 Columns
  { id: 'col-0', cells: [[0,0], [1,0], [2,0], [3,0], [4,0]] },
  { id: 'col-1', cells: [[0,1], [1,1], [2,1], [3,1], [4,1]] },
  { id: 'col-2', cells: [[0,2], [1,2], [2,2], [3,2], [4,2]] },
  { id: 'col-3', cells: [[0,3], [1,3], [2,3], [3,3], [4,3]] },
  { id: 'col-4', cells: [[0,4], [1,4], [2,4], [3,4], [4,4]] },

  // 2 Diagonals
  { id: 'diag-main', cells: [[0,0], [1,1], [2,2], [3,3], [4,4]] },
  { id: 'diag-anti', cells: [[0,4], [1,3], [2,2], [3,1], [4,0]] },
];

/** Fisher-Yates array shuffle */
export function shuffle(array, rng = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Check completed Bingo lines on any 5x5 board given a Set of marked numbers */
export function checkBingoLines(board, markedNumbersSet) {
  if (!Array.isArray(board) || board.length !== 5) return [];
  const completed = [];

  for (const line of ALL_LINES) {
    let full = true;
    for (const [r, c] of line.cells) {
      const val = board[r]?.[c];
      if (val === undefined || val === null || !markedNumbersSet.has(val)) {
        full = false;
        break;
      }
    }
    if (full) {
      completed.push(line.id);
    }
  }

  return completed;
}

/**
 * 1. Board Layout Generator by Difficulty
 * Produces a valid 5x5 matrix containing numbers 1..25 without duplicates.
 * The layout does not change the bot's strength (the opponent cannot see it, and every number is
 * on every card); it only gives each difficulty its own look when the card is revealed.
 */
export function generateBotBoard(difficulty = 'pro', rng = Math.random) {
  const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  if (difficulty === 'beginner') {
    // Pure random distribution
    const shuffled = shuffle(allNumbers, rng);
    const board = [];
    for (let r = 0; r < 5; r++) {
      board.push(shuffled.slice(r * 5, r * 5 + 5));
    }
    return board;
  }

  if (difficulty === 'intermediate') {
    // Semi-structured layout: diagonal anchors first, then the rest.
    const shuffled = shuffle(allNumbers, rng);
    const board = Array.from({ length: 5 }, () => Array(5).fill(null));

    const diagCoords = [
      [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
      [0, 4], [1, 3], [3, 1], [4, 0]
    ];

    let poolIndex = 0;
    for (const [r, c] of diagCoords) {
      if (board[r][c] === null) {
        board[r][c] = shuffled[poolIndex++];
      }
    }

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (board[r][c] === null) {
          board[r][c] = shuffled[poolIndex++];
        }
      }
    }
    return board;
  }

  // PRO: centre, then diagonals, then the centre cross, then the remaining edge cells.
  const shuffledNumbers = shuffle(allNumbers, rng);
  const board = Array.from({ length: 5 }, () => Array(5).fill(null));

  board[2][2] = shuffledNumbers[0];

  const corners = shuffle([[0, 0], [0, 4], [4, 0], [4, 4]], rng);
  board[corners[0][0]][corners[0][1]] = shuffledNumbers[1];
  board[corners[1][0]][corners[1][1]] = shuffledNumbers[2];
  board[corners[2][0]][corners[2][1]] = shuffledNumbers[3];
  board[corners[3][0]][corners[3][1]] = shuffledNumbers[4];

  const innerDiags = shuffle([[1, 1], [1, 3], [3, 1], [3, 3]], rng);
  board[innerDiags[0][0]][innerDiags[0][1]] = shuffledNumbers[5];
  board[innerDiags[1][0]][innerDiags[1][1]] = shuffledNumbers[6];
  board[innerDiags[2][0]][innerDiags[2][1]] = shuffledNumbers[7];
  board[innerDiags[3][0]][innerDiags[3][1]] = shuffledNumbers[8];

  const crossArms = shuffle([[2, 0], [2, 1], [2, 3], [2, 4], [0, 2], [1, 2], [3, 2], [4, 2]], rng);
  for (let i = 0; i < crossArms.length; i++) {
    const [r, c] = crossArms[i];
    board[r][c] = shuffledNumbers[9 + i];
  }

  let nextIdx = 17;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === null) {
        board[r][c] = shuffledNumbers[nextIdx++];
      }
    }
  }

  return board;
}

/* ------------------------------------------------------------------------------------------------
 * 2. Bitboard helpers
 * A card state is a 25-bit integer: bit (r * 5 + c) is set when that cell is marked.
 * ---------------------------------------------------------------------------------------------- */

const FULL_MASK = 0x1ffffff;

/** The 12 lines as cell masks, same order as ALL_LINES. */
export const LINE_MASKS = ALL_LINES.map(line =>
  line.cells.reduce((mask, [r, c]) => mask | (1 << (r * 5 + c)), 0)
);

/** How many lines each cell sits on: 2 for edges, 3 for diagonals, 4 for the centre. */
const CELL_DEGREE = Array.from({ length: 25 }, (_, i) => LINE_MASKS.filter(m => m & (1 << i)).length);

/** Every way to pick 5 of the 12 lines, as the union of their cells (792 masks). */
const FIVE_LINE_SETS = (() => {
  const out = [];
  const n = LINE_MASKS.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++)
          for (let e = d + 1; e < n; e++)
            out.push(LINE_MASKS[a] | LINE_MASKS[b] | LINE_MASKS[c] | LINE_MASKS[d] | LINE_MASKS[e]);
  return Int32Array.from(out);
})();
const SET_COST = new Uint8Array(FIVE_LINE_SETS.length);

/** Bit counts for 13-bit chunks; a 25-bit mask needs two lookups. */
const POP13 = new Uint8Array(1 << 13);
for (let i = 1; i < POP13.length; i++) POP13[i] = POP13[i >> 1] + (i & 1);

/** Number of set bits in a 32-bit integer. */
export function popcount(x) {
  return POP13[x & 0x1fff] + POP13[(x >>> 13) & 0x1fff] + POP13[x >>> 26];
}

/** number -> cell index (0..24) for a 5x5 board, as a 26-slot array (-1 when absent). */
export function boardPositions(board) {
  const positions = new Int8Array(26).fill(-1);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = Number(board[r]?.[c]);
      if (val >= 1 && val <= 25) positions[val] = r * 5 + c;
    }
  }
  return positions;
}

/** Mask of the cells marked by the called numbers. */
export function markedMask(positions, calledNumbers) {
  let mask = 0;
  for (const n of calledNumbers) {
    const p = positions[Number(n)];
    if (p >= 0) mask |= 1 << p;
  }
  return mask;
}

/** How many of the 12 lines are complete in a mask. */
export function countCompletedLines(mask) {
  let count = 0;
  for (let i = 0; i < LINE_MASKS.length; i++) {
    if ((mask & LINE_MASKS[i]) === LINE_MASKS[i]) count++;
  }
  return count;
}

/* ------------------------------------------------------------------------------------------------
 * 3. Learned policy: linear value over features of the card after a candidate call
 * ---------------------------------------------------------------------------------------------- */

export const POLICY_FEATURES = [
  'bias',
  'lines1', 'lines2', 'lines3', 'lines4', 'lines5',      // lines with that many marks
  'sumSquares',                                           // sum over lines of marks^2, / 25
  'cellOnDiagonal', 'cellIsCentre',                       // the called cell sits on 3 or 4 lines
  'remaining',                                            // uncalled numbers, / 25
  'cellsToFive',                                          // fewest extra marks for 5 lines, / 10
  'bestSets',                                             // log2(1 + five-line sets at that cost) / 10
  'nearSets',                                             // log2(1 + sets one mark worse) / 10
  'helpfulShare',                                         // share of unmarked cells that lower cellsToFive
  'nearHelpfulShare',                                     // share of unmarked cells in a best or near set
  'cellsToFiveXRemaining',
  'helpfulShareXRemaining',
  'cellsToFiveSquared',
  'softCellsToFive',                                      // -log2(sum over sets of 2^-cost) / 10: tempo that also counts breadth
  'withinTwoSets'                                         // log2(1 + sets at most two marks worse) / 10
];

/** 2^-cost for set costs 0..25 */
const HALF_POW = Float64Array.from({ length: 26 }, (_, i) => Math.pow(0.5, i));

/**
 * Features of a card state. `marked` is the mask after the candidate call, `cellIndex` the cell
 * that call marks. Returns a plain array aligned with POLICY_FEATURES.
 */
export function policyFeatures(marked, cellIndex) {
  const unmarked = ~marked & FULL_MASK;
  const remaining = popcount(unmarked);

  let lines1 = 0, lines2 = 0, lines3 = 0, lines4 = 0, lines5 = 0, sumSquares = 0;
  for (let i = 0; i < LINE_MASKS.length; i++) {
    const k = popcount(marked & LINE_MASKS[i]);
    sumSquares += k * k;
    if (k === 1) lines1++;
    else if (k === 2) lines2++;
    else if (k === 3) lines3++;
    else if (k === 4) lines4++;
    else if (k === 5) lines5++;
  }

  let best = 25;
  for (let i = 0; i < FIVE_LINE_SETS.length; i++) {
    const cost = popcount(unmarked & FIVE_LINE_SETS[i]);
    SET_COST[i] = cost;
    if (cost < best) best = cost;
  }
  let bestSets = 0, nearSets = 0, withinTwo = 0, helpMask = 0, nearMask = 0, soft = 0;
  for (let i = 0; i < FIVE_LINE_SETS.length; i++) {
    const cost = SET_COST[i];
    soft += HALF_POW[cost];
    if (cost === best) {
      bestSets++;
      helpMask |= unmarked & FIVE_LINE_SETS[i];
    } else if (cost === best + 1) {
      nearSets++;
      nearMask |= unmarked & FIVE_LINE_SETS[i];
    } else if (cost === best + 2) {
      withinTwo++;
    }
  }
  nearMask |= helpMask;
  withinTwo += bestSets + nearSets;

  const helpfulShare = remaining ? popcount(helpMask) / remaining : 0;
  const nearHelpfulShare = remaining ? popcount(nearMask) / remaining : 0;
  const degree = CELL_DEGREE[cellIndex] || 0;
  const rem = remaining / 25;
  const need = best / 10;

  return [
    1,
    lines1, lines2, lines3, lines4, lines5,
    sumSquares / 25,
    degree === 3 ? 1 : 0,
    degree === 4 ? 1 : 0,
    rem,
    need,
    Math.log2(1 + bestSets) / 10,
    Math.log2(1 + nearSets) / 10,
    helpfulShare,
    nearHelpfulShare,
    need * rem,
    helpfulShare * rem,
    need * need,
    -Math.log2(soft) / 10,
    Math.log2(1 + withinTwo) / 10
  ];
}

/** Linear value of a feature vector. */
export function policyValue(features, weights) {
  let v = 0;
  for (let i = 0; i < weights.length; i++) v += features[i] * weights[i];
  return v;
}

/** Mean value over the opponent's next mark, which lands on a uniformly random unmarked cell. */
function valueAfterRandomMark(marked, cellIndex, weights) {
  const unmarked = ~marked & FULL_MASK;
  if (unmarked === 0 || countCompletedLines(marked) >= 5) {
    return policyValue(policyFeatures(marked, cellIndex), weights);
  }
  let total = 0, count = 0;
  for (let i = 0; i < 25; i++) {
    if (unmarked & (1 << i)) {
      total += policyValue(policyFeatures(marked | (1 << i), cellIndex), weights);
      count++;
    }
  }
  return total / count;
}

/**
 * Pick the uncalled number with the best learned value.
 * options: { rng, epsilon (share of uniformly random calls), lookahead (average over the
 * opponent's next random mark; slower and off by default) }.
 * Returns null when the board is invalid or nothing is left to call.
 */
export function getLearnedMove(board, calledNumbers = [], policy = botPolicy, options = {}) {
  if (!Array.isArray(board) || board.length !== 5) return null;
  const { rng = Math.random, epsilon = 0, lookahead = false } = options;
  const weights = policy?.weights;
  if (!Array.isArray(weights) || weights.length !== POLICY_FEATURES.length) {
    return getHeuristicMove(board, calledNumbers, 'pro', rng);
  }

  const positions = boardPositions(board);
  const calledSet = new Set(calledNumbers.map(Number));
  const uncalled = [];
  for (let n = 1; n <= 25; n++) {
    if (positions[n] >= 0 && !calledSet.has(n)) uncalled.push(n);
  }
  if (uncalled.length === 0) return null;

  const marked = markedMask(positions, calledNumbers);

  // A call that reaches five lines ends the round: take it.
  for (const n of uncalled) {
    if (countCompletedLines(marked | (1 << positions[n])) >= 5) return n;
  }

  if (epsilon > 0 && rng() < epsilon) {
    return uncalled[Math.floor(rng() * uncalled.length)];
  }

  let bestNumber = uncalled[0];
  let bestScore = -Infinity;
  for (const n of uncalled) {
    const cell = positions[n];
    const after = marked | (1 << cell);
    let score = lookahead
      ? valueAfterRandomMark(after, cell, weights)
      : policyValue(policyFeatures(after, cell), weights);
    score += rng() * 1e-9; // break exact ties at random
    if (score > bestScore) {
      bestScore = score;
      bestNumber = n;
    }
  }
  return bestNumber;
}

/* ------------------------------------------------------------------------------------------------
 * 4. Hand-written heuristic (the previous bot). Still used for 'beginner', and by the training
 *    scripts as a fixed opponent.
 * ---------------------------------------------------------------------------------------------- */
export function getHeuristicMove(botBoard, calledNumbers = [], difficulty = 'pro', rng = Math.random) {
  if (!Array.isArray(botBoard) || botBoard.length !== 5) return null;

  const calledSet = new Set(calledNumbers);

  // Uncalled numbers on bot's board
  const uncalled = [];
  const numToPos = new Map(); // number -> { r, c }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = botBoard[r][c];
      if (val !== null && val !== undefined) {
        numToPos.set(val, { r, c });
        if (!calledSet.has(val)) {
          uncalled.push(val);
        }
      }
    }
  }

  if (uncalled.length === 0) return null;

  // --- FIRST MOVE ---
  if (calledNumbers.length === 0) {
    if (difficulty === 'pro') {
      const centerVal = botBoard[2][2];
      if (centerVal && !calledSet.has(centerVal)) {
        return centerVal;
      }
    } else if (difficulty === 'intermediate') {
      if (rng() < 0.5) {
        const centerVal = botBoard[2][2];
        if (centerVal && !calledSet.has(centerVal)) return centerVal;
      }
      const cornerPositions = [[0, 0], [0, 4], [4, 0], [4, 4]];
      const cornerVal = botBoard[cornerPositions[Math.floor(rng() * 4)][0]][cornerPositions[Math.floor(rng() * 4)][1]];
      if (cornerVal && !calledSet.has(cornerVal)) return cornerVal;
    } else {
      return uncalled[Math.floor(rng() * uncalled.length)];
    }
  }

  // 1. Status of all 12 lines on the bot's board
  const lineStats = ALL_LINES.map(line => {
    let markedCount = 0;
    const missingNumbers = [];

    for (const [r, c] of line.cells) {
      const val = botBoard[r][c];
      if (calledSet.has(val)) {
        markedCount++;
      } else {
        missingNumbers.push(val);
      }
    }

    return {
      id: line.id,
      markedCount,
      isCompleted: markedCount === 5,
      missingNumbers
    };
  });

  const completedLinesCount = lineStats.filter(l => l.isCompleted).length;

  const numberToLines = new Map();
  for (const num of uncalled) {
    numberToLines.set(num, []);
  }

  for (const line of lineStats) {
    if (!line.isCompleted) {
      for (const num of line.missingNumbers) {
        numberToLines.get(num)?.push(line);
      }
    }
  }

  // 2. Immediate win
  for (const num of uncalled) {
    const parentLines = numberToLines.get(num) || [];
    const linesCompletedByThisNum = parentLines.filter(l => l.markedCount === 4).length;
    if (completedLinesCount + linesCompletedByThisNum >= 5) {
      return num;
    }
  }

  // 3. Beginner: 35% chance to take an immediate 1-away line, otherwise random
  if (difficulty === 'beginner') {
    const immediateFinishers = uncalled.filter(num => {
      const parentLines = numberToLines.get(num) || [];
      return parentLines.some(l => l.markedCount === 4);
    });

    if (immediateFinishers.length > 0 && rng() < 0.35) {
      return immediateFinishers[Math.floor(rng() * immediateFinishers.length)];
    }
    return uncalled[Math.floor(rng() * uncalled.length)];
  }

  // 4. Five target lines: the incomplete lines with the most marks
  const incompleteLines = lineStats.filter(l => !l.isCompleted).sort((a, b) => b.markedCount - a.markedCount);
  const targetLinesSet = new Set();

  for (const line of incompleteLines) {
    if (targetLinesSet.size < 5) {
      targetLinesSet.add(line.id);
    }
  }

  // 5. Score candidates
  const candidateScores = uncalled.map(num => {
    const parentLines = numberToLines.get(num) || [];
    const pos = numToPos.get(num) || { r: 2, c: 2 };
    let score = 0;

    let completedLinesWithNum = 0;
    let threatLinesWithNum = 0;

    for (const line of parentLines) {
      if (line.markedCount === 4) {
        completedLinesWithNum++;
        score += difficulty === 'pro' ? 8000 : 3500;
      } else if (line.markedCount === 3) {
        threatLinesWithNum++;
        score += difficulty === 'pro' ? 1200 : 600;
      } else if (line.markedCount === 2) {
        score += difficulty === 'pro' ? 240 : 120;
      } else if (line.markedCount === 1) {
        score += difficulty === 'pro' ? 60 : 30;
      } else {
        score += 15;
      }

      if (targetLinesSet.has(line.id)) {
        score += difficulty === 'pro' ? 450 : 200;
      }
    }

    if (completedLinesWithNum >= 2) {
      score += difficulty === 'pro' ? 15000 : 5000;
    }

    if (threatLinesWithNum >= 2) {
      score += difficulty === 'pro' ? 3000 : 1000;
    }

    const isCenter = pos.r === 2 && pos.c === 2;
    const isDiag = (pos.r === pos.c) || (pos.r + pos.c === 4);

    if (isCenter) {
      score += difficulty === 'pro' ? 300 : 100;
    } else if (isDiag) {
      score += difficulty === 'pro' ? 120 : 50;
    }

    score += rng() * 15;

    return { num, score };
  });

  candidateScores.sort((a, b) => b.score - a.score);

  if (candidateScores.length === 0) return uncalled[0];

  if (difficulty === 'intermediate') {
    const roll = rng();
    if (roll < 0.70 || candidateScores.length === 1) {
      return candidateScores[0].num;
    } else if (roll < 0.90 || candidateScores.length === 2) {
      return candidateScores[1].num;
    } else {
      return candidateScores[Math.min(2, candidateScores.length - 1)].num;
    }
  }

  return candidateScores[0].num;
}

/* ------------------------------------------------------------------------------------------------
 * 5. Next move by difficulty. This is what the game calls.
 * ---------------------------------------------------------------------------------------------- */
export function getBotNextMove({ botBoard, calledNumbers = [], difficulty = 'pro', rng = Math.random, policy = botPolicy }) {
  if (!Array.isArray(botBoard) || botBoard.length !== 5) return null;

  if (difficulty === 'beginner') {
    return getHeuristicMove(botBoard, calledNumbers, 'beginner', rng);
  }
  if (difficulty === 'intermediate') {
    return getLearnedMove(botBoard, calledNumbers, policy, { rng, epsilon: 0.35 });
  }
  return getLearnedMove(botBoard, calledNumbers, policy, { rng });
}
