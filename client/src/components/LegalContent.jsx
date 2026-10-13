import React from 'react';
import './LegalContent.css';

export default function LegalContent() {
  return (
    <div className="legal-content-body">
      <div className="legal-intro-banner">
        <span className="legal-badge">Official Terms & Notice</span>
        <h2 className="legal-intro-title">Legal Terms, Conditions & Disclaimer</h2>
        <p className="legal-intro-subtitle">
          Effective Date: 2026 &bull; Author & Developer: <strong>Tarnala Sribatsa Patro</strong>
        </p>
      </div>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">1</span>
          <h3>Intellectual Property &amp; Ownership</h3>
        </div>
        <p>
          This website, its source code, architecture, design, and branding are the exclusive property of{' '}
          <strong>Tarnala Sribatsa Patro</strong>. All rights reserved globally. Unauthorized reproduction, modification, 
          scraping, or redistribution without express written consent is strictly prohibited.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">2</span>
          <h3>Absolute Limitation of Developer Liability</h3>
        </div>
        <p>
          This platform (Bingo Online Multiplayer, together with any associated developer tools, transit relays, 
          or web applications) is provided strictly on an <strong>&ldquo;AS IS&rdquo;</strong> and{' '}
          <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without warranties of any kind, whether express, statutory, 
          or implied.
        </p>
        <p>
          The developer (<strong>Tarnala Sribatsa Patro</strong>) shall <strong>NOT</strong> be held liable, accountable, 
          or responsible for any direct, indirect, incidental, punitive, or consequential damages resulting from:
        </p>
        <ul className="legal-bullets">
          <li>
            <strong>Data Loss &amp; Auto-Purging:</strong> Accidental, scheduled, or unexpected loss of uploaded files, 
            notes, credentials, snippets, match sessions, room records, or player statistics due to expiration, server maintenance, 
            ephemeral storage recycling, or system interruptions.
          </li>
          <li>
            <strong>Phishing, Fraud &amp; Malicious Misuse:</strong> Any malicious, fraudulent, unauthorized, or deceptive activities 
            carried out by third parties using the platform, including phishing campaigns, social engineering, unauthorized room takeovers, 
            or transmission of harmful software.
          </li>
          <li>
            <strong>Security Compromises:</strong> Interception, interception attempts, unauthorized access, or disclosure resulting 
            from shared codes, weak passcodes, or compromised user networks/devices.
          </li>
          <li>
            <strong>Prior Notice:</strong> The developer shall not be held liable for failure to provide advance warnings regarding outages, 
            downtime, or data removal.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">3</span>
          <h3>Right to Modify, Update, and Terminate</h3>
        </div>
        <p>
          The developer reserves the sole, unilateral right to update, modify, add, or amend these terms, features, policies, 
          storage limitations, or platform rules at any time, with or without prior notice to users. Continued use of the platform 
          constitutes immediate and binding acceptance of all revised terms.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">4</span>
          <h3>Acceptable Use &amp; Regulatory Compliance</h3>
        </div>
        <p>
          Users agree to comply with all applicable local, national, and international laws, regulations, and cyber statutes. 
          You may not upload, transmit, or store content that is unlawful, defamatory, copyrighted without authorization, abusive, 
          obscene, or harmful. Users may not attempt to overwhelm, disrupt, or exploit the platform through denial-of-service attempts, 
          malicious scripts, or automated abuse.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">5</span>
          <h3>Ephemeral Architecture Notice</h3>
        </div>
        <p>
          This service operates as a temporary transit relay. Content is designed to self-destruct automatically. 
          Do not use this service as a permanent backup, primary file storage, or cloud archive. Live multiplayer rooms, 
          game states, and board allocations are ephemeral and automatically recycled upon room closure or server restart.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">6</span>
          <h3>Entertainment &amp; No Gambling Disclaimer</h3>
        </div>
        <p>
          Bingo Online Multiplayer is built exclusively for casual recreational amusement and social fun with friends and family. 
          The platform does not support, endorse, promote, or offer real-money gambling, wagering, betting, or cash prizes of any 
          description. In-game points, round wins, leaderboards, and completed lines hold zero real-world monetary value.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">7</span>
          <h3>Privacy &amp; Local Client Storage</h3>
        </div>
        <p>
          The platform does not require registration, passwords, email addresses, or financial information. No third-party 
          tracking or marketing cookies are used. The platform utilizes local client storage (such as browser{' '}
          <code>localStorage</code> / <code>sessionStorage</code>) strictly for essential functionality, including audio mute preferences, 
          player nicknames, and room reconnect tokens.
        </p>
      </section>

      <section className="legal-section">
        <div className="legal-section-header">
          <span className="legal-section-num">8</span>
          <h3>Governing Law &amp; Contact</h3>
        </div>
        <p>
          These terms and disclaimers are governed globally in accordance with standard civil and intellectual property statutes. 
          For questions, legal notifications, or copyright inquiries, please contact the developer,{' '}
          <strong>Tarnala Sribatsa Patro</strong>.
        </p>
      </section>
    </div>
  );
}
