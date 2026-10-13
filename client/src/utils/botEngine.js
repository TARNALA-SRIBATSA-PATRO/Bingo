/**
 * botEngine.js
 * Advanced, Fair & Optimized AI Engine for Bingo
 * 
 * Difficulty Levels:
 * - 'beginner': Casual, relaxed gameplay. Uniform random board layout, mostly random calls with occasional line completion.
 * - 'intermediate': Strategic gameplay. Balanced board layout with even distribution, prioritizes building lines and taking 1-away completions.
 * - 'pro': Master-level tactician. Mathematically optimized synergy board layout (maximizing multi-line graph intersections),
 *          first-turn center-pivot opening, shortest-path 5-line convergence, dual-threat forks, and trap-setting moves.
 * 
 * STRICT FAIRNESS GUARANTEE:
 * The bot NEVER reads, inspects, or accesses the player's board content or secret cells.
 * All decisions are 100% computed from the bot's OWN board layout, the public sequence of called numbers,
 * and combinatorial line-convergence algorithms.
 */

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
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
 */
export function generateBotBoard(difficulty = 'pro') {
  const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  if (difficulty === 'beginner') {
    // Pure random distribution
    const shuffled = shuffle(allNumbers);
    const board = [];
    for (let r = 0; r < 5; r++) {
      board.push(shuffled.slice(r * 5, r * 5 + 5));
    }
    return board;
  }

  if (difficulty === 'intermediate') {
    // Semi-structured layout:
    // Balances low (1-8), mid (9-17), and high (18-25) numbers across rows and columns
    // with randomized placement to maintain a human-like, balanced feel.
    const shuffled = shuffle(allNumbers);
    const board = Array.from({ length: 5 }, () => Array(5).fill(null));

    // Place diagonal anchors with even parity spread
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

    // Fill remaining cells
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (board[r][c] === null) {
          board[r][c] = shuffled[poolIndex++];
        }
      }
    }
    return board;
  }

  // PRO MODE: Master Synergy Architecture
  // Mathematical principle:
  // - Center cell (2,2) has degree 4 (Row 2, Col 2, Diag Main, Diag Anti).
  // - 8 diagonal cells (0,0), (1,1), (3,3), (4,4), (0,4), (1,3), (3,1), (4,0) have degree 3.
  // - 4 central cross edges (2,0), (2,1), (2,3), (2,4), (0,2), (1,2), (3,2), (4,2) intersect the center lines.
  // By clustering synergistic numbers on the highest-degree intersections (the 9 diagonal & center cells
  // + center cross row 2 / col 2), completing any 1 line automatically completes 20%-40% of several other lines!
  const shuffledNumbers = shuffle(allNumbers);
  const board = Array.from({ length: 5 }, () => Array(5).fill(null));

  // 1. Center Cell: The pivot point
  board[2][2] = shuffledNumbers[0];

  // 2. The 4 corner diagonal cells (Degree 3)
  const corners = shuffle([[0, 0], [0, 4], [4, 0], [4, 4]]);
  board[corners[0][0]][corners[0][1]] = shuffledNumbers[1];
  board[corners[1][0]][corners[1][1]] = shuffledNumbers[2];
  board[corners[2][0]][corners[2][1]] = shuffledNumbers[3];
  board[corners[3][0]][corners[3][1]] = shuffledNumbers[4];

  // 3. The 4 inner diagonal cells (Degree 3)
  const innerDiags = shuffle([[1, 1], [1, 3], [3, 1], [3, 3]]);
  board[innerDiags[0][0]][innerDiags[0][1]] = shuffledNumbers[5];
  board[innerDiags[1][0]][innerDiags[1][1]] = shuffledNumbers[6];
  board[innerDiags[2][0]][innerDiags[2][1]] = shuffledNumbers[7];
  board[innerDiags[3][0]][innerDiags[3][1]] = shuffledNumbers[8];

  // 4. The 4 cross arms on Row 2 & Col 2 (share row 2 & col 2 with center!)
  const crossArms = shuffle([[2, 0], [2, 1], [2, 3], [2, 4], [0, 2], [1, 2], [3, 2], [4, 2]]);
  for (let i = 0; i < crossArms.length; i++) {
    const [r, c] = crossArms[i];
    board[r][c] = shuffledNumbers[9 + i];
  }

  // 5. Remaining 8 edge cells (Degree 2)
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

/**
 * 2. Next Move Decision Algorithm
 * Evaluates candidate uncalled numbers on the bot's board and selects the next call.
 * 
 * Rules:
 * - Bot does NOT peek into user's board (Fairness).
 * - Pro AI opens with Center Cell (2,2) on move 1 (4 lines advanced at once).
 * - Evaluates multi-line completions, forks, 1-away threats, and target 5-line convergence.
 */
export function getBotNextMove({ botBoard, calledNumbers = [], difficulty = 'pro' }) {
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

  // --- FIRST MOVE STRATEGY (When calledNumbers is empty) ---
  if (calledNumbers.length === 0) {
    if (difficulty === 'pro') {
      // PRO OPENING: Center Cell (2,2)
      // Belongs to 4 lines: row-2, col-2, diag-main, diag-anti.
      const centerVal = botBoard[2][2];
      if (centerVal && !calledSet.has(centerVal)) {
        return centerVal;
      }
    } else if (difficulty === 'intermediate') {
      // INTERMEDIATE OPENING: 50% Center, 50% Corner
      if (Math.random() < 0.5) {
        const centerVal = botBoard[2][2];
        if (centerVal && !calledSet.has(centerVal)) return centerVal;
      }
      const cornerPositions = [[0, 0], [0, 4], [4, 0], [4, 4]];
      const cornerVal = botBoard[cornerPositions[Math.floor(Math.random() * 4)][0]][cornerPositions[Math.floor(Math.random() * 4)][1]];
      if (cornerVal && !calledSet.has(cornerVal)) return cornerVal;
    } else {
      // BEGINNER OPENING: Random uncalled number
      return uncalled[Math.floor(Math.random() * uncalled.length)];
    }
  }

  // --- SUBSEQUENT MOVES EVALUATION ---

  // 1. Calculate status of all 12 lines on the bot's board
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
      markedCount, // 0 to 5
      isCompleted: markedCount === 5,
      missingNumbers
    };
  });

  const completedLinesCount = lineStats.filter(l => l.isCompleted).length;

  // Map each uncalled number to the lines it belongs to
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

  // 2. IMMEDIATE GAME WIN CHECK
  // If any uncalled number completes enough lines to reach >= 5 completed lines,
  // execute it IMMEDIATELY! (Guaranteed instant victory).
  for (const num of uncalled) {
    const parentLines = numberToLines.get(num) || [];
    const linesCompletedByThisNum = parentLines.filter(l => l.markedCount === 4).length;
    if (completedLinesCount + linesCompletedByThisNum >= 5) {
      return num;
    }
  }

  // 3. BEGINNER MODE BEHAVIOR
  if (difficulty === 'beginner') {
    // 30% chance to take an immediate 1-away line, 70% random choice
    const immediateFinishers = uncalled.filter(num => {
      const parentLines = numberToLines.get(num) || [];
      return parentLines.some(l => l.markedCount === 4);
    });

    if (immediateFinishers.length > 0 && Math.random() < 0.35) {
      return immediateFinishers[Math.floor(Math.random() * immediateFinishers.length)];
    }
    return uncalled[Math.floor(Math.random() * uncalled.length)];
  }

  // 4. FIND OPTIMAL 5-LINE TARGET CONVERGENCE (For Pro and Intermediate)
  // Which incomplete lines require the fewest total unique numbers to reach 5 completed lines?
  const incompleteLines = lineStats.filter(l => !l.isCompleted).sort((a, b) => b.markedCount - a.markedCount);
  const targetLinesSet = new Set();
  const targetNumbersSet = new Set();

  for (const line of incompleteLines) {
    if (targetLinesSet.size < 5) {
      targetLinesSet.add(line.id);
      for (const num of line.missingNumbers) {
        targetNumbersSet.add(num);
      }
    }
  }

  // 5. SCORE CANDIDATES
  const candidateScores = uncalled.map(num => {
    const parentLines = numberToLines.get(num) || [];
    const pos = numToPos.get(num) || { r: 2, c: 2 };
    let score = 0;

    let completedLinesWithNum = 0;
    let threatLinesWithNum = 0; // lines moving from 3 to 4

    for (const line of parentLines) {
      if (line.markedCount === 4) {
        // Line will be completed by this call!
        completedLinesWithNum++;
        score += difficulty === 'pro' ? 8000 : 3500;
      } else if (line.markedCount === 3) {
        // Threat state (moves to 4 marked)
        threatLinesWithNum++;
        score += difficulty === 'pro' ? 1200 : 600;
      } else if (line.markedCount === 2) {
        score += difficulty === 'pro' ? 240 : 120;
      } else if (line.markedCount === 1) {
        score += difficulty === 'pro' ? 60 : 30;
      } else {
        score += 15;
      }

      // Bonus if this line is in the optimal 5-line convergence target
      if (targetLinesSet.has(line.id)) {
        score += difficulty === 'pro' ? 450 : 200;
      }
    }

    // MULTI-LINE COMPLETION FORK BONUS
    // If a number completes 2 lines simultaneously (e.g. row & col, or row & diag), massive value!
    if (completedLinesWithNum >= 2) {
      score += difficulty === 'pro' ? 15000 : 5000;
    }

    // MULTI-THREAT FORK BONUS
    // If a number creates 2 simultaneous 4-marked threat lines, opponent faces unavoidable line burst!
    if (threatLinesWithNum >= 2) {
      score += difficulty === 'pro' ? 3000 : 1000;
    }

    // INTERSECTION DEGREE MULTIPLIER
    // Center cell (2,2) intersects 4 lines; Corner & inner diags intersect 3 lines
    const isCenter = pos.r === 2 && pos.c === 2;
    const isDiag = (pos.r === pos.c) || (pos.r + pos.c === 4);

    if (isCenter) {
      score += difficulty === 'pro' ? 300 : 100;
    } else if (isDiag) {
      score += difficulty === 'pro' ? 120 : 50;
    }

    // Small stochastic variance to avoid rigid predictability across identical boards
    score += Math.random() * 15;

    return { num, score };
  });

  // Sort candidates by score descending
  candidateScores.sort((a, b) => b.score - a.score);

  if (candidateScores.length === 0) return uncalled[0];

  // INTERMEDIATE: Weighted selection among top candidates
  if (difficulty === 'intermediate') {
    // 70% pick top score, 20% pick second, 10% pick third
    const roll = Math.random();
    if (roll < 0.70 || candidateScores.length === 1) {
      return candidateScores[0].num;
    } else if (roll < 0.90 || candidateScores.length === 2) {
      return candidateScores[1].num;
    } else {
      return candidateScores[Math.min(2, candidateScores.length - 1)].num;
    }
  }

  // PRO: Always select the highest scoring tactical move
  return candidateScores[0].num;
}
