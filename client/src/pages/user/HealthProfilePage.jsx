import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  Heart,
  Phone,
  Shield,
  Scale,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function HealthProfilePage() {
  const { user, token, isDemoMode, demoData } = useAuth();

  const [formData, setFormData] = useState({
    blood_group: '',
    height: '',
    weight: '',
    allergies: '',
    existing_conditions: '',
    current_medications: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    dietary_preferences: '',
    lifestyle_notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    if (isDemoMode) {
      setFormData(demoData.healthProfile);
      setLoading(false);
      return;
    }

    if (!token) return;

    fetch('/api/user/health-profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setFormData({
            blood_group: data.profile.blood_group || '',
            height: data.profile.height || '',
            weight: data.profile.weight || '',
            allergies: data.profile.allergies || '',
            existing_conditions: data.profile.existing_conditions || '',
            current_medications: data.profile.current_medications || '',
            emergency_contact_name: data.profile.emergency_contact_name || '',
            emergency_contact_phone: data.profile.emergency_contact_phone || '',
            emergency_contact_relation: data.profile.emergency_contact_relation || '',
            dietary_preferences: data.profile.dietary_preferences || '',
            lifestyle_notes: data.profile.lifestyle_notes || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        setLoading(false);
      });
  }, [token, isDemoMode]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg(null);

    if (isDemoMode) {
      setTimeout(() => {
        setSaving(false);
        setFeedbackMsg({ type: 'success', text: 'Demo profile updated in presentation memory.' });
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/user/health-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw data;

      setFeedbackMsg({ type: 'success', text: 'Health profile successfully updated and secured.' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  // BMI Calculation
  const heightM = formData.height ? Number(formData.height) / 100 : 0;
  const weightKg = formData.weight ? Number(formData.weight) : 0;
  const bmi = heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null;

  return (
    <div className="dashboard-body" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <UserCheck size={28} style={{ color: 'var(--primary-600)' }} />
          Personal Health Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your clinical baseline. Every field starts empty and is strictly under your private control.
        </p>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: feedbackMsg.type === 'success' ? 'var(--accent-emerald-subtle)' : 'var(--danger-50)',
          border: `1.5px solid ${feedbackMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--danger-500)'}`,
          color: feedbackMsg.type === 'success' ? '#065f46' : 'var(--danger-600)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '600'
        }}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Section 1: Physical Vitals & BMI */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title"><Scale size={20} /> Physical Baseline & Vitals</h3>
              <p className="card-subtitle">Blood group, height, weight, and automated BMI</p>
            </div>
            {bmi && (
              <div style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Calculated BMI: {bmi}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                name="blood_group"
                className="form-control"
                value={formData.blood_group}
                onChange={handleChange}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                step="0.5"
                name="height"
                className="form-control"
                placeholder="175"
                value={formData.height}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                name="weight"
                className="form-control"
                placeholder="70"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Allergies & Conditions */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="card-header">
            <h3 className="card-title"><Heart size={20} style={{ color: 'var(--danger-500)' }} /> Allergies & Chronic Conditions</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Known Allergies (Food, Environmental, Medication)</label>
            <input
              type="text"
              name="allergies"
              className="form-control"
              placeholder="e.g. Penicillin (anaphylaxis), Peanuts, Dust mites"
              value={formData.allergies}
              onChange={handleChange}
            />
            <span className="form-helper">This helps the AI Assistant advise you against potential allergen triggers.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Existing Health Conditions</label>
            <textarea
              rows="2"
              name="existing_conditions"
              className="form-control"
              placeholder="e.g. Type 2 Diabetes, Mild Asthma, Essential Hypertension"
              value={formData.existing_conditions}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Current Medications</label>
            <textarea
              rows="2"
              name="current_medications"
              className="form-control"
              placeholder="e.g. Metformin 500mg twice daily, Albuterol inhaler as needed"
              value={formData.current_medications}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Section 3: Emergency Contacts */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="card-header">
            <h3 className="card-title"><Phone size={20} style={{ color: 'var(--accent-teal)' }} /> Primary Emergency Contact</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Full Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                className="form-control"
                placeholder="John Doe"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                className="form-control"
                placeholder="+91 98765 43210"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input
                type="text"
                name="emergency_contact_relation"
                className="form-control"
                placeholder="Parent / Spouse / Sibling"
                value={formData.emergency_contact_relation}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dietary & Lifestyle Preferences */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title"><Shield size={20} /> Lifestyle & Nutritional Preferences</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dietary Preferences</label>
              <input
                type="text"
                name="dietary_preferences"
                className="form-control"
                placeholder="e.g. Vegetarian, Low-sodium, Gluten-free, Mediterranean"
                value={formData.dietary_preferences}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lifestyle / Exercise Habits</label>
              <input
                type="text"
                name="lifestyle_notes"
                className="form-control"
                placeholder="e.g. Sedentary desk job, 30 min daily walking, 7 hours sleep"
                value={formData.lifestyle_notes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
            <Save size={18} /> {saving ? 'Encrypting & Saving...' : 'Save Health Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
