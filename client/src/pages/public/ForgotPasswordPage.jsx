import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw data;

      navigate('/reset-password', { state: { email, devOtp: data.devOtp } });
    } catch (err) {
      setError(err.error || 'Failed to initiate password recovery.');
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="nav-brand-icon" style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}>
            <KeyRound size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Recover Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enter your registered email address to receive a reset code
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-600)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Sending Code...' : 'Send Reset Code'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
