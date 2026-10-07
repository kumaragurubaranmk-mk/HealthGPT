import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Globe,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function SettingsPage() {
  const { user, token, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  // Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  // Export Data State
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (isDemoMode) {
        alert('Exporting synthetic demo record package.');
        setExporting(false);
        return;
      }

      const res = await fetch('/api/user/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthgpt_data_export_${user?.id || 'patient'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Type "DELETE" to permanently purge your account, health profile, medical notes, vitals, and all messages. This action is irreversible.'
    );

    if (confirmation !== 'DELETE') return;

    setDeleting(true);

    if (isDemoMode) {
      alert('Demo session reset.');
      logout();
      navigate('/');
      return;
    }

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Your account and private medical records have been completely purged from the system.');
        logout();
        navigate('/');
      }
    } catch (err) {
      alert('Failed to purge account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: feedbackCategory,
          message: feedbackMsg.trim(),
          rating: feedbackRating
        })
      });

      if (res.ok) {
        setFeedbackStatus({ type: 'success', text: 'Thank you! Your feedback has been sent to our editorial board.' });
        setFeedbackMsg('');
      }
    } catch (err) {
      setFeedbackStatus({ type: 'error', text: 'Failed to submit feedback.' });
    }
  };

  return (
    <div className="dashboard-body" style={{ maxWidth: '880px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <Settings size={28} style={{ color: 'var(--primary-600)' }} />
          Account, Privacy & Platform Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your personal health data retention, visual themes, and security controls.
        </p>
      </div>

      {/* Prominent Privacy Statement */}
      <div className="card" style={{
        backgroundColor: 'var(--primary-50)',
        border: '1.5px solid var(--primary-500)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={22} style={{ color: 'var(--primary-600)' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-700)', margin: 0 }}>
            Privacy Principle
          </h2>
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          "Your health information is private and is only stored when you choose to provide it."
        </p>
      </div>

      {/* Section 1: Appearance & Language */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Preferences</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <label className="form-label">Theme Mode</label>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
            </button>
          </div>

          <div>
            <label className="form-label">Language</label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="form-control"
              style={{ minWidth: '180px', fontWeight: '600' }}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Data Ownership & Export */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
          <Download size={20} /> Data Ownership & Export
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Download a full snapshot of your health profile, recorded vitals, medications, and appointment history in machine-readable JSON format.
        </p>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="btn btn-secondary"
        >
          <Download size={16} /> {exporting ? 'Generating Bundle...' : 'Export My Health Records (JSON)'}
        </button>
      </div>

      {/* Section 3: Submit Feedback */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
          <MessageSquare size={20} /> Feedback & Bug Reports
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Help us improve HealthGPT by submitting suggestions or reporting discrepancies.
        </p>

        {feedbackStatus && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedbackStatus.type === 'success' ? 'var(--accent-emerald-subtle)' : 'var(--danger-50)',
            color: feedbackStatus.type === 'success' ? '#065f46' : 'var(--danger-600)',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {feedbackStatus.text}
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
              >
                <option value="suggestion">Feature Suggestion</option>
                <option value="bug">Bug Report</option>
                <option value="content">Medical Content Query</option>
                <option value="general">General Feedback</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Rating</label>
              <select
                className="form-control"
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(Number(e.target.value))}
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                <option value="4">⭐⭐⭐⭐ 4 - Good</option>
                <option value="3">⭐⭐⭐ 3 - Average</option>
                <option value="2">⭐⭐ 2 - Poor</option>
                <option value="1">⭐ 1 - Very Unsatisfied</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              rows="3"
              className="form-control"
              placeholder="Tell us your feedback or issue..."
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Submit Feedback
          </button>
        </form>
      </div>

      {/* Section 4: Danger Zone (Account Deletion & Purge) */}
      <div className="card" style={{ borderColor: 'var(--danger-500)' }}>
        <h3 className="card-title" style={{ color: 'var(--danger-600)', marginBottom: '0.5rem' }}>
          <Trash2 size={20} /> Permanent Account Deletion & Hard Purge
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Permanently erase all profile details, health vitals, medication reminders, records, and AI dialogues. This data cannot be recovered once purged.
        </p>

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="btn btn-danger"
        >
          <Trash2 size={16} /> {deleting ? 'Purging Records...' : 'Purge All Health Data & Delete Account'}
        </button>
      </div>
    </div>
  );
}
