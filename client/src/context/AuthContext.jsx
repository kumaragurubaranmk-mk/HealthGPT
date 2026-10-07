import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Synthetic presentation data (strictly isolated from real database)
const SYNTHETIC_DEMO_DATA = {
  user: {
    id: 'demo-synthetic-uuid-101',
    full_name: 'Alex Rivera (Fictional Demo Patient)',
    email: 'alex.rivera@synthetic.fictional',
    phone: '+1 555-019-2834',
    guardian_email: 'maria.rivera@synthetic.fictional',
    guardian_phone: '+1 555-019-2835',
    date_of_birth: '1998-05-14',
    is_verified: 1,
    status: 'active'
  },
  healthProfile: {
    blood_group: 'O+',
    height: 176,
    weight: 71.5,
    allergies: 'Penicillin, Shellfish (Mild hives)',
    existing_conditions: 'Mild Seasonal Allergic Rhinitis',
    current_medications: 'Cetirizine 10mg as needed, Multivitamin daily',
    emergency_contact_name: 'Maria Rivera (Sister)',
    emergency_contact_phone: '+1 555-019-2835',
    emergency_contact_relation: 'Sister',
    dietary_preferences: 'Plant-forward Mediterranean',
    lifestyle_notes: 'Runs 5k twice a week, seeks 8 hours of sleep.'
  },
  records: [
    {
      id: 'rec-syn-1',
      title: 'Annual Cardiovascular Health Screening',
      category: 'visit',
      record_date: '2026-08-15',
      doctor_name: 'Dr. Sarah Lin, MD',
      facility_name: 'Metro Wellness Clinic',
      notes: 'Resting ECG normal. Lipid panel within optimal parameters. Advised continued aerobic conditioning.',
      attachment_name: 'cardio_report_summary.pdf'
    },
    {
      id: 'rec-syn-2',
      title: 'Comprehensive Metabolic Panel & Lipid Profile',
      category: 'lab',
      record_date: '2026-08-10',
      doctor_name: 'Dr. Sarah Lin, MD',
      facility_name: 'BioCore Diagnostics',
      notes: 'Fasting glucose: 89 mg/dL. Total cholesterol: 172 mg/dL. HDL: 56 mg/dL. LDL: 98 mg/dL.',
      attachment_name: 'metabolic_panel.pdf'
    }
  ],
  reminders: [
    {
      id: 'rem-syn-1',
      medicine_name: 'Daily Multivitamin & Omega-3',
      dosage: '1 capsule',
      frequency: 'once_daily',
      reminder_time: '08:30',
      start_date: '2026-01-01',
      notes: 'Take after breakfast with water.',
      status: 'active'
    },
    {
      id: 'rem-syn-2',
      medicine_name: 'Cetirizine',
      dosage: '10mg',
      frequency: 'as_needed',
      reminder_time: '20:00',
      start_date: '2026-05-01',
      notes: 'Take at night if pollen count exceeds high threshold.',
      status: 'active'
    }
  ],
  metrics: [
    { id: 'm-1', metric_type: 'heart_rate', metric_value: 68, unit: 'bpm', recorded_at: '2026-10-01T08:00:00Z' },
    { id: 'm-2', metric_type: 'heart_rate', metric_value: 72, unit: 'bpm', recorded_at: '2026-10-02T08:00:00Z' },
    { id: 'm-3', metric_type: 'heart_rate', metric_value: 66, unit: 'bpm', recorded_at: '2026-10-03T08:00:00Z' },
    { id: 'm-4', metric_type: 'heart_rate', metric_value: 70, unit: 'bpm', recorded_at: '2026-10-04T08:00:00Z' },
    { id: 'm-5', metric_type: 'heart_rate', metric_value: 65, unit: 'bpm', recorded_at: '2026-10-05T08:00:00Z' },
    { id: 'm-6', metric_type: 'blood_pressure', metric_value: 118, secondary_value: 78, unit: 'mmHg', recorded_at: '2026-10-01T09:00:00Z' },
    { id: 'm-7', metric_type: 'blood_pressure', metric_value: 120, secondary_value: 80, unit: 'mmHg', recorded_at: '2026-10-04T09:00:00Z' },
    { id: 'm-8', metric_type: 'blood_pressure', metric_value: 116, secondary_value: 76, unit: 'mmHg', recorded_at: '2026-10-06T09:00:00Z' },
    { id: 'm-9', metric_type: 'sleep', metric_value: 7.5, unit: 'hours', recorded_at: '2026-10-04T07:00:00Z' },
    { id: 'm-10', metric_type: 'sleep', metric_value: 8.0, unit: 'hours', recorded_at: '2026-10-05T07:00:00Z' },
    { id: 'm-11', metric_type: 'water', metric_value: 8, unit: 'glasses', recorded_at: '2026-10-05T20:00:00Z' }
  ]
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('healthgpt_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setUser(SYNTHETIC_DEMO_DATA.user);
      setLoading(false);
      return;
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch authenticated user profile
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('healthgpt_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token, isDemoMode]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw data;
    }

    localStorage.setItem('healthgpt_token', data.token);
    if (data.user?.preferred_language) {
      localStorage.setItem('vitacare_lang', data.user.preferred_language);
    }
    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(false);
    window.dispatchEvent(new Event('vitacare:auth-login'));
    return data;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  };

  const verifyOtp = async (email, otpCode) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw data;
    }

    localStorage.setItem('healthgpt_token', data.token);
    if (data.user?.preferred_language) {
      localStorage.setItem('vitacare_lang', data.user.preferred_language);
    }
    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(false);
    window.dispatchEvent(new Event('vitacare:auth-login'));
    return data;
  };

  const logout = () => {
    localStorage.removeItem('healthgpt_token');
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
    window.dispatchEvent(new Event('vitacare:auth-logout'));
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!user,
        isDemoMode,
        demoData: SYNTHETIC_DEMO_DATA,
        toggleDemoMode,
        login,
        register,
        verifyOtp,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
