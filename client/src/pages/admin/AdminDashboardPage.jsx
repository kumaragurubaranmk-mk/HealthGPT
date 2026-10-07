import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Video,
  FileText,
  Globe,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Bell,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminDashboardPage() {
  const { adminToken } = useAdminAuth();
  const [data, setData] = useState({
    stats: {},
    languageConfiguration: {},
    websiteConfiguration: {},
    settings: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;

    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load admin stats:', err);
        setLoading(false);
      });
  }, [adminToken]);

  const stats = data.stats || {};
  const settings = data.websiteConfiguration || data.settings || {};
  const langConfig = data.languageConfiguration || {};

  return (
    <div className="dashboard-body" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '0.25rem', letterSpacing: '0.04em' }}>
              ADMIN CONTROL
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              VitaCare Healthcare Management System
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.2rem' }}>
            Administrator Governance Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
            Real-time monitoring of registered users, medicine verification adherence, guardian escalation alerts, and system settings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/admin/settings"
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.65rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Sliders size={16} /> Edit Configuration
          </Link>
        </div>
      </div>

      {/* Security Firewall Banner (Requirement 1 & 6) */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <ShieldCheck size={28} color="#16a34a" style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', margin: '0 0 0.2rem' }}>
            Authorized Administrative Session • Zero Patient Health Exposure
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0 }}>
            Under VitaCare security standards, only authorized administrators with valid JWT tokens can access administrative controls. All patient data is strictly isolated and guarded.
          </p>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 10 CORE METRICS REQUIRED BY REQUIREMENT 8 */}
      {/* ======================================================================= */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
        Operational Health Metrics (10 Core Controls)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        
        {/* 1. Total Registered Users */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Registered Users
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#0284c7' }}>
            {stats.totalUsers ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Registered patient accounts
          </div>
        </div>

        {/* 2. Active Users */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Users
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#10b981' }}>
            {stats.activeUsers ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {stats.suspendedUsers ?? 0} suspended
          </div>
        </div>

        {/* 3. Medicine Schedules */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Medicine Schedules
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#6366f1' }}>
            {stats.medicineSchedules ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Active prescription tracks
          </div>
        </div>

        {/* 4. Pending Medicines */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Pending Medicines
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#f59e0b' }}>
            {stats.pendingMedicines ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Awaiting patient intake confirmation
          </div>
        </div>

        {/* 5. Verified Medicines */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Verified Medicines
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#059669' }}>
            {stats.verifiedMedicines ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Patient confirmed & guardian notified
          </div>
        </div>

        {/* 6. Missed Medicines */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Missed Medicines
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#dc2626' }}>
            {stats.missedMedicines ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Escalated or unconfirmed doses
          </div>
        </div>

        {/* 7. Guardian Alerts */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Guardian Alerts
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#d97706' }}>
            {stats.guardianAlerts ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            SMS & emergency dispatches
          </div>
        </div>

        {/* 8. Care Connect Activity */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Care Connect Activity
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#0891b2' }}>
            {stats.careConnectActivity ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Real device video sessions
          </div>
        </div>

        {/* 9. Uploaded Reports & Prescriptions */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Reports & Prescriptions
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.35rem 0', color: '#8b5cf6' }}>
            {(stats.uploadedReports || 0) + (stats.uploadedPrescriptions || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {stats.uploadedReports ?? 0} reports • {stats.uploadedPrescriptions ?? 0} prescriptions
          </div>
        </div>

        {/* 10. Language & Website Configuration Overview */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Languages Supported
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0', color: '#0284c7' }}>
            4 Languages
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            🇬🇧 EN • 🇮🇳 TA • 🇮🇳 TE • 🇮🇳 HI
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* MANAGEMENT MODULES & DIRECT CONTROLS */}
      {/* ======================================================================= */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
        Administrative Control Center
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        {/* Module 1: Medicine Schedules & Adherence */}
        <Link
          to="/admin/medicines"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <Pill size={22} color="#0284c7" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medicines & Schedules
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
              Add, edit, or delete patient medicines and dosage schedules. Monitor verified vs pending intake compliance.
            </p>
          </div>
          <div style={{ marginTop: '1.25rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
            Manage Medicines <ArrowRight size={16} />
          </div>
        </Link>

        {/* Module 2: System Configuration (Settings, Care Connect, Escalations) */}
        <Link
          to="/admin/settings"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <Sliders size={22} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Website & Escalation Settings
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
              Configure warning call attempt limits (default: {settings.max_patient_warning_attempts || 2}), timeout thresholds ({settings.warning_timeout_minutes || 15}m), Care Connect toggles, and default languages.
            </p>
          </div>
          <div style={{ marginTop: '1.25rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
            Configure System <ArrowRight size={16} />
          </div>
        </Link>

        {/* Module 3: User Directory */}
        <Link
          to="/admin/users"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <Users size={22} color="#6366f1" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                User Management
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
              Search registered users, inspect registration metadata, and manage account statuses without exposing private medical dialogue.
            </p>
          </div>
          <div style={{ marginTop: '1.25rem', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
            Open User Directory <ArrowRight size={16} />
          </div>
        </Link>
      </div>
    </div>
  );
}
