import { useAudio } from '../context/AudioContext';
import { VolumeIcon, VolumeMuteIcon } from './Icons';
import './SoundToggle.css';

export default function SoundToggle({ className = '', mini = false }) {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      className={`sound-toggle-btn ${isMuted ? 'muted' : 'unmuted'} ${mini ? 'mini' : ''} ${className}`}
      onClick={toggleMute}
      title={isMuted ? 'Unmute music' : 'Mute music'}
      aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
      type="button"
    >
      <span className="sound-icon-wrap">
        {isMuted ? <VolumeMuteIcon size={18} /> : <VolumeIcon size={18} />}
      </span>
    </button>
  );
}
