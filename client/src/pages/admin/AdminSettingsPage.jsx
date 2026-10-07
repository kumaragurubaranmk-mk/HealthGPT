import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Key,
  ShieldAlert,
  CheckCircle2,
  Save,
  Globe,
  Video,
  PhoneCall,
  Settings,
  Bell
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminSettingsPage() {
  const { adminToken } = useAdminAuth();

  // Settings State
  const [config, setConfig] = useState({
    site_name: 'VitaCare AI',
    site_tagline: 'Personal Health Copilot',
    support_phone: '+1 (800) 848-2227',
    emergency_number: '108',
    max_patient_warning_attempts: '2',
    warning_timeout_minutes: '15',
    careconnect_enabled: 'true',
    careconnect_default_supervisor: 'Nurse Elena Vance, RN',
    default_language: 'en',
    ai_provider: 'builtin',
    ai_temperature: '0.3'
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!adminToken) return;

    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setConfig(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(err => console.error('Failed to load admin settings:', err));
  }, [adminToken]);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (!res.ok) throw data;

      setFeedback({ type: 'success', text: 'All system settings and escalation parameters updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.error || 'Failed to update system configuration.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-body" style={{ maxWidth: '920px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0 0 0.35rem' }}>
          <Sliders size={26} color="#0284c7" />
          Website Configuration & Escalation Controls
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
          Manage global site settings, medicine warning attempts, Care Connect camera rules, and language configurations.
        </p>
      </div>

      {feedback && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        
        {/* SECTION 1: Health Tracker & Escalation Rules (Requirement 5) */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Bell size={20} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Medicine Alert & Guardian Escalation Thresholds
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Maximum Patient Warning Attempts
              </label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={config.max_patient_warning_attempts}
                onChange={(e) => handleChange('max_patient_warning_attempts', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Default is 2 attempts before escalating to guardian.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Warning Timeout Window (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                required
                value={config.warning_timeout_minutes}
                onChange={(e) => handleChange('warning_timeout_minutes', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Waiting window for patient confirmation before escalating (default: 15 min).
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Care Connect Settings (Requirement 3) */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Video size={20} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Care Connect Camera & Video Call Settings
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Care Connect Module Status
              </label>
              <select
                value={config.careconnect_enabled}
                onChange={(e) => handleChange('careconnect_enabled', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="true">Enabled (Real device camera via WebRTC)</option>
                <option value="false">Temporarily Disabled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Default Care Supervisor Display
              </label>
              <input
                type="text"
                value={config.careconnect_default_supervisor}
                onChange={(e) => handleChange('careconnect_default_supervisor', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Multi-Language & Branding (Requirement 4) */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Globe size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Multi-Language & Platform Branding
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Default Platform Language
              </label>
              <select
                value={config.default_language}
                onChange={(e) => handleChange('default_language', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="en">🇬🇧 English</option>
                <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
                <option value="te">🇮🇳 Telugu (తెలుగు)</option>
                <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Application Name
              </label>
              <input
                type="text"
                value={config.site_name}
                onChange={(e) => handleChange('site_name', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Emergency Hotline
              </label>
              <input
                type="text"
                value={config.emergency_number}
                onChange={(e) => handleChange('emergency_number', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Support Telephone
              </label>
              <input
                type="text"
                value={config.support_phone}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.65rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Save size={18} />
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
