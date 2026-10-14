import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LegalModal from './LegalModal';
import './Footer.css';

export default function Footer() {
  const location = useLocation();
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Do not render site footer on executive admin console
  if (location.pathname.startsWith('/sys-admin')) {
    return null;
  }

  const handleLegalClick = (e) => {
    // Prevent standard navigation if user is just clicking inside app,
    // allowing modal to open without refreshing or leaving active game room
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      setShowLegalModal(true);
    }
  };

  return (
    <>
      <footer className="site-footer" role="contentinfo">
        <div className="footer-container">
          <p className="footer-text">
            <span className="copyright-part">
              &copy; {new Date().getFullYear()} Tarnala Sribatsa Patro. All Rights Reserved.
            </span>
            <span className="footer-dot" aria-hidden="true">&middot;</span>
            <a 
              href="/legal" 
              className="footer-legal-link"
              onClick={handleLegalClick}
              title="View Legal Terms & Disclaimer"
            >
              Legal &amp; Disclaimer
            </a>
          </p>
        </div>
      </footer>

      <LegalModal 
        isOpen={showLegalModal} 
        onClose={() => setShowLegalModal(false)} 
      />
    </>
  );
}
