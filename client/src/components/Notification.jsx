import { useGame } from '../context/GameContext';
import { CheckIcon, InfoIcon, AlertIcon } from './Icons';
import './Notification.css';

const ICONS = {
  success: CheckIcon,
  error: AlertIcon,
  warning: AlertIcon,
  info: InfoIcon
};

export default function Notification() {
  const { notification } = useGame();
  if (!notification) return null;
  const type = notification.type || 'info';
  const Icon = ICONS[type] || InfoIcon;
  return (
    <div className={`notification notif-${type}`} role="status" aria-live="polite">
      <Icon size={16} />
      <span className="notif-message">{notification.msg}</span>
    </div>
  );
}
