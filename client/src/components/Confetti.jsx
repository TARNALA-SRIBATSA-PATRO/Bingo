import { useEffect, useRef } from 'react';

const COLORS = ['#f0b63a', '#f3efe4', '#e8775d', '#5fb3e6', '#63cfa3'];

// A short burst of paper from the top of the screen, drawn on a canvas.
// Skipped entirely when the OS asks for reduced motion.
export default function Confetti({ duration = 2600 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('lite')) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.scale(dpr, dpr);

    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.4,
      vx: (Math.random() - 0.5) * 2.2,
      vy: 2.4 + Math.random() * 3.2,
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = now - start;
      c.clearRect(0, 0, w, h);
      const fade = t > duration - 600 ? Math.max(0, (duration - t) / 600) : 1;
      c.globalAlpha = fade;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vr;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        c.restore();
      }
      if (t < duration) raf = requestAnimationFrame(tick);
      else c.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />;
}
