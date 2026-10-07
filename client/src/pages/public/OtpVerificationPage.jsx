import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function OtpVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || '');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(location.state?.message || 'A 6-digit verification code was generated.');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      // If user landed here directly without email state
      const savedEmail = localStorage.getItem('healthgpt_pending_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, [email]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otpCode) {
      setError('Please enter both your email address and the 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      navigate('/dashboard', { state: { justRegistered: true } });
    } catch (err) {
      setError(err.error || 'Verification failed. Please double check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' })
      });
      const data = await res.json();
      if (!res.ok) throw data;

      setDevOtp(data.devOtp);
      setInfoMessage('A new verification code has been generated.');
    } catch (err) {
      setError(err.error || 'Failed to resend code.');
    } finally {
      setResending(false);
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
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Verify Your Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enter the 6-digit verification code sent for {email || 'your account'}
          </p>
        </div>

        {/* Prototype Dev OTP Instant Autofill Banner */}
        {devOtp && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--accent-amber-subtle)',
            border: '1.5px solid var(--accent-amber)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>
                Prototype Dev OTP:
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.15em', color: '#78350f' }}>
                {devOtp}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(devOtp)}
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}
            >
              <Sparkles size={14} /> Auto-fill Code
            </button>
          </div>
        )}

        {infoMessage && !devOtp && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--primary-50)',
            border: '1px solid var(--primary-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-700)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {infoMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-600)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify}>
          {!location.state?.email && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">6-Digit Code</label>
            <input
              type="text"
              maxLength="6"
              required
              className="form-control"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              style={{
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.3em',
                fontWeight: '700'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            {loading ? 'Verifying...' : 'Verify and Access Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw size={14} className={resending ? 'spin' : ''} />
            {resending ? 'Sending...' : 'Resend Code'}
          </button>

          <Link to="/login" style={{ color: 'var(--text-muted)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
