import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, toggleDemoMode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.unverified) {
        navigate('/verify-otp', { state: { email: err.email, devOtp: err.devOtp } });
      } else {
        setError(err.error || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemo = () => {
    toggleDemoMode();
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'radial-gradient(circle at 50% 10%, #f0f9ff 0%, #ffffff 80%)'
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.12), 0 0 1px rgba(0,0,0,0.1)',
          border: '1.5px solid #e0f2fe'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              margin: '0 auto 1rem',
              width: '54px',
              height: '54px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.3)'
            }}
          >
            <HeartPulse size={30} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            VitaCare <span style={{ color: '#0284c7' }}>AI</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, fontWeight: 500 }}>
            Your Health. Organized. Intelligent. Connected.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '0.65rem',
              color: '#dc2626',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              {t.auth?.email || 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '0.65rem',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                {t.auth?.password || 'Password'}
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '0.65rem',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.65rem',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Authenticating...' : (t.auth?.signIn || 'Sign In to VitaCare')} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ margin: '1.75rem 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ borderColor: '#e2e8f0' }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffffff',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            Instant Evaluation
          </span>
        </div>

        {/* 1-Click Demo Evaluation Mode */}
        <button
          onClick={handleLaunchDemo}
          style={{
            width: '100%',
            backgroundColor: '#f0f9ff',
            border: '2px solid #0284c7',
            color: '#0284c7',
            borderRadius: '0.65rem',
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={16} /> 1-Click Demo Evaluation Sign In
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '700', color: '#0284c7', textDecoration: 'none' }}>
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
