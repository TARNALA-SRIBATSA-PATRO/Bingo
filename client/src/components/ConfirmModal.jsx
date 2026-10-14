import React from 'react';
import { LogOutIcon } from './Icons';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Leave',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay confirm-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-badge">
          <LogOutIcon size={24} className="confirm-icon-svg" />
        </div>
        
        <h3 className="confirm-modal-title">{title}</h3>
        {message && <p className="confirm-modal-message">{message}</p>}

        <div className="confirm-modal-actions">
          <button 
            type="button" 
            className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-btn-action`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button 
            type="button" 
            className="btn btn-ghost confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
