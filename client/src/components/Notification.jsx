import { useGame } from '../context/GameContext';
import { CheckIcon, SparklesIcon } from './Icons';
import './Notification.css';

export default function Notification() {
  const { notification } = useGame();
  if (!notification) return null;
  return (
    <div className={`notification notif-${notification.type || 'info'}`}>
      <span className="notif-icon-bubble">
        {notification.type === 'success' ? <CheckIcon size={13} /> : <SparklesIcon size={13} />}
      </span>
      <span className="notif-message">{notification.msg}</span>
    </div>
  );
}

