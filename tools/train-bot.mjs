#!/usr/bin/env node
/**
 * train-bot.mjs
 * Trains the bot's linear policy by self-play and writes client/src/utils/botPolicy.json.
 *
 * The policy scores every candidate call with weights . features(card after the call); the game
 * plays the best score. Training samples calls from a softmax over those scores and follows the
 * Monte Carlo policy gradient (REINFORCE): after each game, every own call is pushed towards or
 * away from what was chosen in proportion to the return it led to. Return: +1 win, -1 loss,
 * 0 draw, minus 0.01 for every further own call, so faster wins score higher. A running mean of
 * the return per (opponent, clock) is the baseline. Opponents are a mix of random marks, the
 * hand-written 'pro' heuristic and the learner itself (both sides of a self-play game learn).
 *
 * A plain value regression (fit weights . features to the return and play the argmax) was tried
 * first and only reached parity with the heuristic: features such as "lines with four marks" are
 * confounded with how far the game has progressed, so a value fit cannot rank the candidates of
 * one decision reliably. The policy gradient compares candidates that share the same clock.
 *
 * Usage: node tools/train-bot.mjs [--episodes 300000] [--seed 1] [--out path]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRng, playGame, parseArgs, POLICY_FEATURES, STEP_COST } from './bot-sim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2), {
  episodes: 300000,
  seed: 1,
  out: path.join(here, '..', 'client', 'src', 'utils', 'botPolicy.json')
});

const F = POLICY_FEATURES.length;
const EPISODES = Math.max(1, Math.floor(args.episodes));
const REPORT_EVERY = 10000;
const GREEDY_CHECK_EVERY = 50000;
const GREEDY_CHECK_GAMES = 2000;
const LR_START = 0.01;
const LR_END = 0.001;
const RMS_DECAY = 0.999;    // per-weight gradient scale (RMSprop), so counts and shares learn at the same pace
const BASELINE_RATE = 0.01;
const OPPONENT_MIX = { random: 0.2, heuristic: 0.4, self: 0.4 };

const rng = makeRng(args.seed);
const weights = new Array(F).fill(0);
const gradScale = new Float64Array(F).fill(1e-4);

// Baseline: running mean return per opponent kind, clock (calls made before the decision) and the
// opponent's distance to five lines. The bot cannot see that distance, but a baseline may use
// anything that does not depend on the chosen call, and it removes most of the opponent's noise.
const NEED_BUCKETS = 26;
const baseline = {
  random: new Float64Array(25 * NEED_BUCKETS),
  heuristic: new Float64Array(25 * NEED_BUCKETS),
  self: new Float64Array(25 * NEED_BUCKETS)
};

function learnFromTrajectory(traj, outcome, ownCalls, oppKind, lr) {
  const base = baseline[oppKind];
  for (let t = 0; t < traj.length; t++) {
    const step = traj[t];
    const furtherOwnCalls = ownCalls - (t + 1);
    const ret = outcome - STEP_COST * furtherOwnCalls;
    const slot = step.clock * NEED_BUCKETS + Math.min(NEED_BUCKETS - 1, step.oppNeed);
    const advantage = ret - base[slot];
    base[slot] += BASELINE_RATE * (ret - base[slot]);
    if (!step.grad) continue; // forced winning call, nothing to learn
    for (let j = 0; j < F; j++) {
      const g = advantage * step.grad[j];
      if (g === 0) continue;
      gradScale[j] = RMS_DECAY * gradScale[j] + (1 - RMS_DECAY) * g * g;
      weights[j] += lr * g / (Math.sqrt(gradScale[j]) + 1e-8);
    }
  }
}

function greedyCheck(games) {
  const checkRng = makeRng(424242);
  const learner = { type: 'learned', weights: weights.slice() };
  const pro = { type: 'heuristic', difficulty: 'pro' };
  let wins = 0, draws = 0;
  for (let g = 0; g < games; g++) {
    const r = playGame([learner, pro], g % 2, checkRng);
    if (r.winner === 0) wins++;
    else if (r.winner === -1) draws++;
  }
  return { wins: wins / games, draws: draws / games, score: (wins + draws / 2) / games };
}

const window = { random: [0, 0, 0], heuristic: [0, 0, 0], self: [0, 0, 0] }; // win, loss, draw
function resetWindow() {
  for (const k of Object.keys(window)) window[k] = [0, 0, 0];
}
function pct(w, n) { return n ? `${(100 * w / n).toFixed(1).padStart(5)}%` : '    - '; }

console.log(`Training ${EPISODES} episodes, seed ${args.seed}, ${F} features`);
console.log(`Opponent mix: random ${OPPONENT_MIX.random}, heuristic pro ${OPPONENT_MIX.heuristic}, self ${OPPONENT_MIX.self}`);
const started = performance.now();

for (let ep = 1; ep <= EPISODES; ep++) {
  const progress = ep / EPISODES;
  const lr = LR_START + (LR_END - LR_START) * progress;

  const roll = rng();
  const oppKind = roll < OPPONENT_MIX.random ? 'random'
    : roll < OPPONENT_MIX.random + OPPONENT_MIX.heuristic ? 'heuristic'
    : 'self';

  const learner = { type: 'softmax', weights };
  const opponent = oppKind === 'random' ? { type: 'random' }
    : oppKind === 'heuristic' ? { type: 'heuristic', difficulty: 'pro' }
    : { type: 'softmax', weights };

  const starter = ep % 2;
  const result = playGame([learner, opponent], starter, rng, { record: [true, oppKind === 'self'] });

  const outcome = result.winner === 0 ? 1 : result.winner === 1 ? -1 : 0;
  learnFromTrajectory(result.traj[0], outcome, result.ownCalls[0], oppKind, lr);
  if (oppKind === 'self') learnFromTrajectory(result.traj[1], -outcome, result.ownCalls[1], oppKind, lr);

  const slot = window[oppKind];
  if (result.winner === 0) slot[0]++;
  else if (result.winner === 1) slot[1]++;
  else slot[2]++;

  if (ep % REPORT_EVERY === 0 || ep === EPISODES) {
    const all = Object.values(window).reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[2]], [0, 0, 0]);
    const n = all[0] + all[1] + all[2];
    const r = window.random, h = window.heuristic, s = window.self;
    const elapsed = ((performance.now() - started) / 1000).toFixed(0).padStart(4);
    let line =
      `${String(ep).padStart(7)} ep  ${elapsed}s  lr ${lr.toFixed(4)}  ` +
      `win ${pct(all[0], n)} (draw ${pct(all[2], n)})  ` +
      `vs random ${pct(r[0], r[0] + r[1] + r[2])}  vs pro ${pct(h[0], h[0] + h[1] + h[2])}  ` +
      `self draw ${pct(s[2], s[0] + s[1] + s[2])}`;
    if (ep % GREEDY_CHECK_EVERY === 0 || ep === EPISODES) {
      const check = greedyCheck(GREEDY_CHECK_GAMES);
      line += `  | greedy vs pro: win ${(100 * check.wins).toFixed(1)}% score ${(100 * check.score).toFixed(1)}%`;
    }
    console.log(line);
    resetWindow();
  }
}

const seconds = (performance.now() - started) / 1000;

let previousVersion = 0;
try {
  previousVersion = Number(JSON.parse(fs.readFileSync(args.out, 'utf8')).version) || 0;
} catch { /* first run */ }

const policy = {
  version: previousVersion + 1,
  trainedAt: new Date().toISOString(),
  episodes: EPISODES,
  seed: args.seed,
  features: POLICY_FEATURES,
  weights: weights.map(w => Number(w.toFixed(6)))
};
fs.writeFileSync(args.out, JSON.stringify(policy, null, 2) + '\n');

console.log(`\nDone in ${seconds.toFixed(1)}s. Wrote ${path.relative(process.cwd(), args.out)} (version ${policy.version})`);
console.log('\nWeights (only differences between candidates matter, so bias and remaining stay at 0):');
const width = Math.max(...POLICY_FEATURES.map(f => f.length));
POLICY_FEATURES.forEach((name, i) => {
  console.log(`  ${name.padEnd(width)}  ${policy.weights[i] >= 0 ? ' ' : ''}${policy.weights[i].toFixed(4)}`);
});
