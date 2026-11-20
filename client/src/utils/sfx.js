// Short synthesised sound effects for play feedback. Nothing is downloaded:
// every sound is a couple of oscillators, so it works offline and loads instantly.
// Follows the same mute setting as the music (localStorage 'bingo_bgm_muted',
// muted by default).

const MUTE_KEY = 'bingo_bgm_muted';
const SFX_KEY = 'bingo_sfx_muted';
let ctx = null;

function isMuted() {
  return isSfxMuted();
}

// Effects follow the music switch until the player sets them separately.
export function isSfxMuted() {
  try {
    const own = localStorage.getItem(SFX_KEY);
    if (own !== null) return own === 'true';
    const music = localStorage.getItem(MUTE_KEY);
    return music === null ? true : music === 'true';
  } catch {
    return true;
  }
}

export function setSfxMuted(muted) {
  try { localStorage.setItem(SFX_KEY, String(Boolean(muted))); } catch {}
}

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq, to = freq, type = 'sine', start = 0, dur = 0.12, gain = 0.18, attack = 0.005 }) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ start = 0, dur = 0.06, gain = 0.12 }) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t0);
}

const SOUNDS = {
  // Picking a cell before confirming.
  select() {
    tone({ freq: 720, type: 'sine', dur: 0.07, gain: 0.12 });
  },
  // A number was called and stamped on the cards.
  stamp() {
    noise({ dur: 0.05, gain: 0.14 });
    tone({ freq: 260, to: 120, type: 'triangle', dur: 0.14, gain: 0.2 });
  },
  // Someone else called a number.
  call() {
    tone({ freq: 480, type: 'sine', dur: 0.08, gain: 0.1 });
    tone({ freq: 640, type: 'sine', start: 0.07, dur: 0.1, gain: 0.1 });
  },
  // It is now your turn.
  turn() {
    tone({ freq: 523, type: 'sine', dur: 0.09, gain: 0.14 });
    tone({ freq: 784, type: 'sine', start: 0.1, dur: 0.14, gain: 0.14 });
  },
  // You completed a line.
  line() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.08, dur: 0.16, gain: 0.16 }));
  },
  // You won the round.
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.11, dur: 0.22, gain: 0.16 }));
    [659, 784, 1046].forEach(f => tone({ freq: f, type: 'sine', start: 0.5, dur: 0.6, gain: 0.08 }));
  },
  // The round ended without you winning.
  lose() {
    tone({ freq: 392, to: 300, type: 'triangle', dur: 0.25, gain: 0.12 });
    tone({ freq: 300, to: 220, type: 'triangle', start: 0.22, dur: 0.35, gain: 0.1 });
  }
};

export function playSfx(name) {
  if (isMuted()) return;
  const fn = SOUNDS[name];
  if (!fn) return;
  try { fn(); } catch {}
}
