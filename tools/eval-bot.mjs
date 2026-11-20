#!/usr/bin/env node
/**
 * eval-bot.mjs
 * Plays seeded matches between bot policies and prints a results table.
 *
 * Usage: node tools/eval-bot.mjs [--games 5000] [--seed 7] [--policy path]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLearnedMove, generateBotBoard, POLICY_FEATURES } from '../client/src/utils/botEngine.js';
import { makeRng, playGame, soloMarks, parseArgs } from './bot-sim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2), {
  games: 5000,
  seed: 7,
  policy: path.join(here, '..', 'client', 'src', 'utils', 'botPolicy.json')
});

const policy = JSON.parse(fs.readFileSync(args.policy, 'utf8'));
if (!Array.isArray(policy.weights) || policy.weights.length !== POLICY_FEATURES.length) {
  console.error(`Policy at ${args.policy} has ${policy.weights?.length ?? 0} weights, expected ${POLICY_FEATURES.length}. Run tools/train-bot.mjs first.`);
  process.exit(1);
}
const N = Math.max(2, Math.floor(args.games));

const LEARNED = { type: 'learned', weights: policy.weights };
const LEARNED_LOOKAHEAD = { type: 'learned', weights: policy.weights, lookahead: true };
const LEARNED_CENTRE = { type: 'learned', weights: policy.weights, centreFirst: true };
const LEARNED_INTERMEDIATE = { type: 'learned', weights: policy.weights, epsilon: 0.35 };
const HEURISTIC_PRO = { type: 'heuristic', difficulty: 'pro' };
const HEURISTIC_INTERMEDIATE = { type: 'heuristic', difficulty: 'intermediate' };
const RANDOM = { type: 'random' };

const matchups = [
  ['learned pro', LEARNED, 'heuristic pro', HEURISTIC_PRO],
  ['learned pro', LEARNED, 'heuristic intermediate', HEURISTIC_INTERMEDIATE],
  ['learned pro', LEARNED, 'random', RANDOM],
  ['heuristic pro', HEURISTIC_PRO, 'random', RANDOM],
  ['learned + lookahead', LEARNED_LOOKAHEAD, 'heuristic pro', HEURISTIC_PRO],
  ['learned + lookahead', LEARNED_LOOKAHEAD, 'learned pro', LEARNED],
  ['learned, centre first', LEARNED_CENTRE, 'heuristic pro', HEURISTIC_PRO],
  ['learned, centre first', LEARNED_CENTRE, 'learned pro', LEARNED],
  ['learned eps 0.35', LEARNED_INTERMEDIATE, 'heuristic pro', HEURISTIC_PRO],
  ['learned eps 0.35', LEARNED_INTERMEDIATE, 'heuristic intermediate', HEURISTIC_INTERMEDIATE],
  ['learned pro', LEARNED, 'learned pro', LEARNED]
];

function runMatchup(a, b, seed) {
  const rng = makeRng(seed);
  const tally = { aWins: 0, bWins: 0, draws: 0, aFirst: [0, 0], aSecond: [0, 0], aWinCalls: 0, bWinCalls: 0 };
  for (let g = 0; g < N; g++) {
    const starter = g % 2;
    const result = playGame([a, b], starter, rng);
    const split = starter === 0 ? tally.aFirst : tally.aSecond;
    split[1]++;
    if (result.winner === 0) {
      tally.aWins++;
      split[0]++;
      tally.aWinCalls += result.calls;
    } else if (result.winner === 1) {
      tally.bWins++;
      tally.bWinCalls += result.calls;
    } else {
      tally.draws++;
    }
  }
  return tally;
}

const pct = x => `${(100 * x).toFixed(1)}%`;
const rows = [];
console.log(`Policy version ${policy.version} (${policy.episodes} episodes), ${N} games per matchup, seed ${args.seed}\n`);

matchups.forEach(([nameA, a, nameB, b], i) => {
  const started = performance.now();
  const t = runMatchup(a, b, args.seed * 1000 + i);
  const secs = ((performance.now() - started) / 1000).toFixed(1);
  const score = (t.aWins + 0.5 * t.draws) / N;
  const ci = 1.96 * Math.sqrt(score * (1 - score) / N);
  rows.push({
    matchup: `${nameA} vs ${nameB}`,
    'A wins': t.aWins,
    'B wins': t.bWins,
    draws: t.draws,
    'A win%': pct(t.aWins / N),
    'A score%': `${pct(score)} +-${(100 * ci).toFixed(1)}`,
    'A first': pct(t.aFirst[0] / t.aFirst[1]),
    'A second': pct(t.aSecond[0] / t.aSecond[1]),
    'calls/A win': t.aWins ? (t.aWinCalls / t.aWins).toFixed(1) : '-',
    'calls/B win': t.bWins ? (t.bWinCalls / t.bWins).toFixed(1) : '-',
    secs
  });
});

console.table(rows);
console.log('A score% counts a draw as half a win; +- is a 95% interval. "A first"/"A second" are A\'s win rates when A calls first/second.');

// Tempo on its own: marks needed for five lines when every other mark is random (lower is better).
console.log('\nAverage marks to five lines with random marks in between (exact optimum 18.48):');
const soloGames = Math.max(2000, N * 2);
for (const [name, spec] of [
  ['learned pro', LEARNED],
  ['learned + lookahead', LEARNED_LOOKAHEAD],
  ['heuristic pro', HEURISTIC_PRO],
  ['heuristic intermediate', HEURISTIC_INTERMEDIATE],
  ['learned eps 0.35', LEARNED_INTERMEDIATE],
  ['random', RANDOM]
]) {
  const games = spec === LEARNED_LOOKAHEAD ? Math.min(soloGames, 2000) : soloGames;
  console.log(`  ${name.padEnd(24)} ${soloMarks(spec, games, makeRng(args.seed + 17)).toFixed(2)}`);
}

// Speed of one decision on an empty card (25 candidates), as the game would call it.
const timingRng = makeRng(99);
const board = generateBotBoard('pro', timingRng);
for (const lookahead of [false, true]) {
  const reps = lookahead ? 200 : 2000;
  const started = performance.now();
  for (let i = 0; i < reps; i++) getLearnedMove(board, [], policy, { rng: timingRng, lookahead });
  const ms = (performance.now() - started) / reps;
  console.log(`getLearnedMove on an empty card${lookahead ? ' with lookahead' : ''}: ${ms.toFixed(3)} ms per call`);
}

const emptyMove = getLearnedMove(board, [], policy, { rng: makeRng(1) });
const [r, c] = [Math.floor((board.flat().indexOf(emptyMove)) / 5), board.flat().indexOf(emptyMove) % 5];
console.log(`Opening call lands on cell (${r}, ${c})${r === 2 && c === 2 ? ' (the centre)' : ''}.`);
