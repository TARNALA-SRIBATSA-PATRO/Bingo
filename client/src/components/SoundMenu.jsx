import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { VolumeIcon, VolumeMuteIcon } from './Icons';
import { isSfxMuted, setSfxMuted, playSfx } from '../utils/sfx';
import './SoundMenu.css';

// One sound button with a small panel: music and effects switched separately.
export default function SoundMenu() {
  const { isMuted, toggleMute } = useAudio();
  const [open, setOpen] = useState(false);
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const anyOn = !isMuted || !sfxMuted;

  const toggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSfxMutedState(next);
    if (!next) playSfx('select');
  };

  return (
    <div className="sound-menu" ref={wrapRef}>
      <button
        className={`icon-btn ${anyOn ? 'is-on' : ''}`}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Sound settings"
        title="Sound"
      >
        {anyOn ? <VolumeIcon size={18} /> : <VolumeMuteIcon size={18} />}
      </button>

      {open && (
        <div className="sound-panel" role="dialog" aria-label="Sound settings">
          <label className="sound-row">
            <span>Music</span>
            <input type="checkbox" role="switch" checked={!isMuted} onChange={toggleMute} />
          </label>
          <label className="sound-row">
            <span>Effects</span>
            <input type="checkbox" role="switch" checked={!sfxMuted} onChange={toggleSfx} />
          </label>
        </div>
      )}
    </div>
  );
}
