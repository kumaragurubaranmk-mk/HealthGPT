import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState(location.state?.devOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw data;

      alert('Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem', textAlign: 'center' }}>Set New Password</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Enter the verification code and your new password
        </p>

        {location.state?.devOtp && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--accent-amber-subtle)',
            border: '1px solid var(--accent-amber)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            Dev Code: <strong>{location.state.devOtp}</strong>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-50)',
            color: 'var(--danger-600)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!location.state?.email && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">6-Digit Reset Code</label>
            <input
              type="text"
              required
              className="form-control"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              required
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              required
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
