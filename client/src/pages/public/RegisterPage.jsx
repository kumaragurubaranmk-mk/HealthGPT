import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, User, Mail, Phone, Calendar, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    guardian_email: '',
    phone: '',
    guardian_phone: '',
    date_of_birth: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(formData);
      // Navigate to OTP verification page with email & devOtp
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          devOtp: res.devOtp,
          message: res.message
        }
      });
    } catch (err) {
      setError(err.error || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="nav-brand-icon" style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}>
            <Activity size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Create Your Health Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            A private, secure, and empty profile is created for you.
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
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="full_name"
                required
                className="form-control"
                placeholder="Jane Doe"
                value={formData.full_name}
                onChange={handleChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Email & Guardian Email */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  required
                  className="form-control"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Guardian / Emergency Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="guardian_email"
                  className="form-control"
                  placeholder="parent.or.guardian@example.com"
                  value={formData.guardian_email}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Shield size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
              <span className="form-helper">Optional: Receives critical emergency notifications if enabled.</span>
            </div>
          </div>

          {/* Phone & Guardian Phone */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Guardian Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="guardian_phone"
                  className="form-control"
                  placeholder="+91 98765 43211"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                name="date_of_birth"
                className="form-control"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  required
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="form-control"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            By creating an account, you acknowledge that HealthGPT is an educational tool and does not provide clinical diagnoses.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Account...' : 'Continue to Verification'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
