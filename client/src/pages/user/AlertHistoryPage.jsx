import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  User,
  Pill,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function AlertHistoryPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const alertT = t.alerts || {};
  const commonT = t.common || {};

  useEffect(() => {
    fetchAlertHistory();
    const handleUpdate = () => fetchAlertHistory();
    window.addEventListener('vitacare:data-updated', handleUpdate);
    return () => window.removeEventListener('vitacare:data-updated', handleUpdate);
  }, [token]);

  const fetchAlertHistory = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('healthgpt_token');
    try {
      const res = await fetch('/api/medications/alerts/history', {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alert history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterType !== 'all') {
      if (filterType === 'calls' && !a.alert_type?.includes('warning') && a.channel !== 'voice_call') return false;
      if (filterType === 'escalations' && a.alert_type !== 'guardian_escalation') return false;
      if (filterType === 'verified' && a.alert_type !== 'intake_verified') return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const med = (a.medicine_name || '').toLowerCase();
      const recip = (a.recipient_name || '').toLowerCase();
      const msg = (a.message || '').toLowerCase();
      return med.includes(q) || recip.includes(q) || msg.includes(q);
    }
    return true;
  });

  const getStatusBadge = (alert) => {
    if (alert.alert_type === 'intake_verified') {
      return (
        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <CheckCircle2 size={13} /> Verified
        </span>
      );
    }
    if (alert.alert_type === 'guardian_escalation' || alert.escalation_status === 'escalated') {
      return (
        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <ShieldAlert size={13} /> Guardian Escalated
        </span>
      );
    }
    if (alert.alert_type === 'patient_warning_1' || alert.attempt_number === 1) {
      return (
        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <PhoneCall size={13} /> Patient Call #1
        </span>
      );
    }
    if (alert.alert_type === 'patient_warning_2' || alert.attempt_number === 2) {
      return (
        <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <PhoneCall size={13} /> Patient Call #2
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600 }}>
        {alert.status || 'Dispatched'}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              {alertT.alertHistoryTitle || 'Alert & Escalation History Log'}
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            {alertT.subtitle || 'Real-time multi-tier escalation audit: Call #1 → Call #2 → Guardian Emergency Dispatch.'}
          </p>
        </div>

        <button
          onClick={fetchAlertHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '0.55rem 1rem',
            borderRadius: '0.5rem',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {commonT.refresh || 'Refresh'}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #f1f5f9'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'calls', label: 'Warning Calls' },
            { id: 'escalations', label: 'Guardian Escalations' },
            { id: 'verified', label: 'Intake Confirmations' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filterType === f.id ? '#2563eb' : '#f8fafc',
                color: filterType === f.id ? '#ffffff' : '#64748b'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={commonT.search || 'Search alerts, medicines...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              fontSize: '0.88rem'
            }}
          />
        </div>
      </div>

      {/* Table / Timeline Records List */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.timeHeader || 'Timestamp'}</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.typeHeader || 'Event Type'}</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.medicineHeader || 'Medicine'}</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.patientHeader || 'Patient / Recipient'}</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.attemptHeader || 'Attempt #'}</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>{alertT.statusHeader || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Bell size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{alertT.noAlertsLogged || 'No alerts or escalations recorded yet.'}</p>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => {
                  const dateStr = alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Recent';
                  return (
                    <tr
                      key={alert.id || index}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={14} color="#64748b" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {alert.alert_type === 'intake_verified'
                            ? 'Dose Intake Verified'
                            : alert.alert_type === 'guardian_escalation'
                            ? 'Guardian Emergency Escalation'
                            : alert.alert_type === 'patient_warning_1'
                            ? 'Patient Warning Call #1'
                            : alert.alert_type === 'patient_warning_2'
                            ? 'Patient Warning Call #2'
                            : 'Automated Alert'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '380px' }}>
                          {alert.message}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a' }}>
                          <Pill size={14} color="#2563eb" />
                          <span>{alert.medicine_name || 'Scheduled Medicine'}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Scheduled: {alert.scheduled_time || '08:00 AM'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b' }}>
                          <User size={14} color="#64748b" />
                          <span>{alert.recipient_name || 'Designated Contact'}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {alert.recipient_phone || alert.channel}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {alert.attempt_number || 1}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(alert)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
