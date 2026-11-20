/**
 * bot-sim.mjs
 * Shared pieces for the bot training and evaluation scripts: a seeded RNG, player specs and a
 * fast game loop that uses the same engine code as the client.
 *
 * Rules: both cards hold 1..25, players alternate calling an uncalled number, a call marks that
 * number on every card, the first card with five complete lines wins, both on the same call is a
 * draw.
 */
import {
  generateBotBoard,
  getHeuristicMove,
  getLearnedMove,
  boardPositions,
  policyFeatures,
  policyValue,
  countCompletedLines,
  POLICY_FEATURES
} from '../client/src/utils/botEngine.js';

export { POLICY_FEATURES };

/** Reward shaping used in training: each own call costs this much, so faster wins score higher. */
export const STEP_COST = 0.01;

const CELLS_TO_FIVE = POLICY_FEATURES.indexOf('cellsToFive');

/** mulberry32: small, fast, seeded. Returns () => number in [0, 1). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Player specs:
 *   { type: 'random' }
 *   { type: 'heuristic', difficulty: 'pro' | 'intermediate' | 'beginner' }
 *   { type: 'learned', weights, epsilon = 0, lookahead = false, centreFirst = false }
 *   { type: 'softmax', weights, temperature = 1 }   stochastic version used while training
 *   { type: 'custom', pick(ctx, rng) }
 */
export function chooseMove(spec, ctx, rng) {
  if (spec.type === 'random') {
    return ctx.uncalled[Math.floor(rng() * ctx.uncalled.length)];
  }
  if (spec.type === 'heuristic') {
    return getHeuristicMove(ctx.board, ctx.calledNumbers, spec.difficulty || 'pro', rng);
  }
  if (spec.type === 'learned') {
    if (spec.centreFirst && ctx.calledNumbers.length === 0) return ctx.board[2][2];
    return getLearnedMove(ctx.board, ctx.calledNumbers, { weights: spec.weights }, {
      rng,
      epsilon: spec.epsilon || 0,
      lookahead: Boolean(spec.lookahead)
    });
  }
  if (spec.type === 'softmax') {
    return softmaxPick(spec, ctx, rng).number;
  }
  if (spec.type === 'custom') {
    return spec.pick(ctx, rng);
  }
  throw new Error(`Unknown player type: ${spec.type}`);
}

/**
 * Sample a call from softmax(weights . features / temperature) over the candidates.
 * Also returns the score-function gradient d log pi / d weights for the sampled call
 * (null when the call was forced because it wins on the spot).
 */
export function softmaxPick(spec, ctx, rng) {
  const { weights, temperature = 1 } = spec;
  const feats = [];
  const logits = [];
  let top = -Infinity;
  for (const n of ctx.uncalled) {
    const cell = ctx.positions[n];
    const after = ctx.marked | (1 << cell);
    if (countCompletedLines(after) >= 5) return { number: n, grad: null };
    const f = policyFeatures(after, cell);
    const z = policyValue(f, weights) / temperature;
    feats.push(f);
    logits.push(z);
    if (z > top) top = z;
  }
  const probs = logits.map(z => Math.exp(z - top));
  const sum = probs.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  let pick = probs.length - 1;
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) { pick = i; break; }
  }
  const F = feats[0].length;
  const grad = new Float64Array(F);
  for (let i = 0; i < feats.length; i++) {
    const p = probs[i] / sum;
    const f = feats[i];
    for (let j = 0; j < F; j++) grad[j] -= p * f[j];
  }
  const chosen = feats[pick];
  for (let j = 0; j < F; j++) grad[j] = (grad[j] + chosen[j]) / temperature;
  return { number: ctx.uncalled[pick], grad };
}

/**
 * Play one game between specs[0] and specs[1]; `starter` (0 or 1) calls first.
 * `record[i]` collects, for each of player i's own calls, { clock, features } (the card after the
 * call) and for a softmax player also `grad` (the score-function gradient of that call).
 * Returns { winner: 0 | 1 | -1 (draw), calls, ownCalls: [n0, n1], traj: [[...], [...]] }.
 */
export function playGame(specs, starter, rng, { record = [false, false] } = {}) {
  const boards = specs.map(s => generateBotBoard(s.boardKind || 'pro', rng));
  const positions = boards.map(boardPositions);
  const marked = [0, 0];
  const calledNumbers = [];
  const calledSet = new Set();
  const ownCalls = [0, 0];
  const traj = [[], []];
  let turn = starter;

  for (;;) {
    const uncalled = [];
    for (let n = 1; n <= 25; n++) if (!calledSet.has(n)) uncalled.push(n);

    const spec = specs[turn];
    const ctx = {
      board: boards[turn],
      positions: positions[turn],
      marked: marked[turn],
      calledNumbers,
      uncalled
    };
    let number;
    let grad = null;
    if (spec.type === 'softmax') {
      ({ number, grad } = softmaxPick(spec, ctx, rng));
    } else {
      number = chooseMove(spec, ctx, rng);
    }

    if (!(number >= 1 && number <= 25) || calledSet.has(number)) {
      throw new Error(`Player ${turn} (${spec.type}) made an invalid call: ${number}`);
    }

    const clock = calledNumbers.length;
    calledNumbers.push(number);
    calledSet.add(number);
    marked[0] |= 1 << positions[0][number];
    marked[1] |= 1 << positions[1][number];
    ownCalls[turn]++;

    if (record[turn]) {
      const other = turn ^ 1;
      traj[turn].push({
        clock,
        grad,
        features: policyFeatures(marked[turn], positions[turn][number]),
        // the opponent's distance to five lines, for a lower-variance training baseline
        oppNeed: Math.round(policyFeatures(marked[other], positions[other][number])[CELLS_TO_FIVE] * 10)
      });
    }

    const done0 = countCompletedLines(marked[0]) >= 5;
    const done1 = countCompletedLines(marked[1]) >= 5;
    if (done0 || done1) {
      const winner = done0 && done1 ? -1 : (done0 ? 0 : 1);
      return { winner, calls: calledNumbers.length, ownCalls, traj };
    }
    if (calledNumbers.length >= 25) {
      // Cannot happen: 25 marks complete all 12 lines on both cards.
      return { winner: -1, calls: 25, ownCalls, traj };
    }
    turn ^= 1;
  }
}

/**
 * Solitaire tempo: the player marks a cell of its choice, then a random unmarked cell is marked,
 * and so on until the card has five lines. Returns the average total marks over `games` games.
 * The opponent's progress never depends on the bot's choices, so this is the quantity a policy
 * really minimises; the exact optimum (dynamic programming over all 2^25 patterns) is 18.48.
 */
export function soloMarks(spec, games, rng) {
  let total = 0;
  for (let g = 0; g < games; g++) {
    const board = generateBotBoard(spec.boardKind || 'pro', rng);
    const positions = boardPositions(board);
    const calledNumbers = [];
    const calledSet = new Set();
    let marked = 0;
    let own = g % 2 === 0; // alternate who marks first, as in a real game
    while (countCompletedLines(marked) < 5) {
      const uncalled = [];
      for (let n = 1; n <= 25; n++) if (!calledSet.has(n)) uncalled.push(n);
      const number = own
        ? chooseMove(spec, { board, positions, marked, calledNumbers, uncalled }, rng)
        : uncalled[Math.floor(rng() * uncalled.length)];
      calledNumbers.push(number);
      calledSet.add(number);
      marked |= 1 << positions[number];
      own = !own;
    }
    total += calledNumbers.length;
  }
  return total / games;
}

/** Simple command line flags: --name value */
export function parseArgs(argv, defaults) {
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out[key] = Number.isFinite(Number(next)) ? Number(next) : next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}
