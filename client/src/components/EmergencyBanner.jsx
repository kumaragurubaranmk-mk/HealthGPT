import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmergencyBanner({ message, keyword, customAction }) {
  return (
    <div className="emergency-banner" role="alert">
      <div className="emergency-banner-icon">
        <AlertTriangle size={24} />
      </div>
      <div className="emergency-banner-content" style={{ flex: 1 }}>
        <h4>URGENT MEDICAL SAFETY WARNING</h4>
        <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.5rem' }}>
          {message || 'If you are experiencing severe chest pain, sudden numbness, difficulty breathing, or severe head trauma, do not wait! Seek emergency care immediately.'}
        </p>
        {keyword && (
          <p style={{ fontSize: '0.85rem', color: 'var(--danger-600)', marginBottom: '0.5rem' }}>
            Flagged critical indicator: <strong>"{keyword}"</strong>
          </p>
        )}
        <div className="emergency-banner-actions">
          <a href="tel:108" className="btn btn-danger btn-sm">
            <PhoneCall size={16} /> Call 108 / 112 (India)
          </a>
          <a href="tel:911" className="btn btn-secondary btn-sm">
            <PhoneCall size={16} /> Call 911 (US)
          </a>
          <Link to="/emergency" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger-500)', color: 'var(--danger-600)' }}>
            <ShieldAlert size={16} /> View Emergency Protocol
          </Link>
          {customAction}
        </div>
      </div>
    </div>
  );
}
