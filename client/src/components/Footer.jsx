import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '3rem 2rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            <div className="nav-brand-icon" style={{ width: '32px', height: '32px' }}>
              <Activity size={18} />
            </div>
            <span>Health<span style={{ color: 'var(--primary-600)' }}>GPT</span></span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Next-generation personal healthcare assistant providing multilingual AI health guidance, triage support, and private wellness tracking.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
            <ShieldCheck size={16} /> Privacy-First Architecture
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>Clinical Modules</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <li><Link to="/ai-assistant">AI Health Assistant</Link></li>
            <li><Link to="/reports">Health Reports & Rx</Link></li>
            <li><Link to="/health-tracker">Vital Health Tracker</Link></li>
            <li><Link to="/medications">Medication Reminders</Link></li>
            <li><Link to="/emergency" style={{ color: 'var(--danger-600)' }}>Emergency Protocols</Link></li>
          </ul>
        </div>

        {/* Education & Resources */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>Resources</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <li><Link to="/education">Health Education Library</Link></li>
            <li><Link to="/medical-dictionary">Medical Dictionary</Link></li>
            <li><Link to="/privacy">Privacy & Consent Policy</Link></li>
            <li><Link to="/terms">Terms of Clinical Guidance</Link></li>
            <li><Link to="/admin/login">Administrator Portal</Link></li>
          </ul>
        </div>

        {/* Emergency Helplines */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>Emergency Hotlines</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            If you are in immediate life-threatening danger, call emergency services directly:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--danger-600)' }}>India: 108 / 112 (Ambulance)</span>
            <span style={{ color: 'var(--danger-600)' }}>United States: 911</span>
            <span style={{ color: 'var(--danger-600)' }}>United Kingdom: 999</span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          © {new Date().getFullYear()} HealthGPT – Personal Health Assistant. Built for Academic & Hackathon Prototype Demonstrations.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>Designed with care for patient privacy</span>
          <Heart size={14} style={{ color: 'var(--danger-500)', fill: 'var(--danger-500)' }} />
        </div>
      </div>
    </footer>
  );
}
