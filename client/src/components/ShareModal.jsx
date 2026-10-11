import { useState } from 'react';
import { copyToClipboard } from '../utils/shareUtils';
import { CopyIcon, CheckIcon, ShareIcon } from './Icons';
import './ShareModal.css';

export default function ShareModal({ data, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!data) return null;
  const { roomId, shareUrl, shareText } = data;

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyCode = async () => {
    try {
      await copyToClipboard(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Join my BINGO room!\nRoom Code: *${roomId}*\nPlay here: ${shareUrl}`
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="share-modal-title">
            <ShareIcon size={20} />
            <h3>Share Game</h3>
          </div>
          <button className="share-close-btn" onClick={onClose} type="button">&times;</button>
        </div>

        <p className="share-modal-subtitle">
          Invite friends to join this round using the room code or link below:
        </p>

        {/* Room Code Box */}
        <div className="share-item-card">
          <div className="share-item-meta">
            <span className="share-item-label">Room Code</span>
            <span className="share-code-value">{roomId}</span>
          </div>
          <button 
            className={`btn btn-sm ${copiedCode ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopyCode}
            type="button"
          >
            {copiedCode ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Game Link Box */}
        <div className="share-item-card">
          <div className="share-item-meta">
            <span className="share-item-label">Direct Invite Link</span>
            <input 
              className="share-link-input" 
              readOnly 
              value={shareUrl} 
              onFocus={e => e.target.select()}
            />
          </div>
          <button 
            className={`btn btn-sm ${copiedLink ? 'btn-success' : 'btn-outline'}`}
            onClick={handleCopyLink}
            type="button"
          >
            {copiedLink ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="share-modal-actions">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-whatsapp"
          >
            Share on WhatsApp
          </a>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
