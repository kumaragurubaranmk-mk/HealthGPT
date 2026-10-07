import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { adminLogin, loading } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await adminLogin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.error || 'Administrative authentication failed.');
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
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', borderTop: '4px solid var(--primary-600)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <ShieldAlert size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Administrator Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Restricted role-based clinical governance console
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
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Username / Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-control"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Verifying Admin Token...' : 'Enter Admin Console'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ← Return to Public Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
