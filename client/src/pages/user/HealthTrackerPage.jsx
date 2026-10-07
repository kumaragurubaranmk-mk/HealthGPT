import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Droplet,
  Plus,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  FilePlus,
  ShieldAlert,
  Info,
  Pill,
  Video,
  Bell,
  PhoneCall,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Camera,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MetricChart } from '../../components/MetricChart';
import { AddHealthReportModal } from '../../components/AddHealthReportModal';
import { CareConnectModal } from '../../components/CareConnectModal';
import { PillConsumptionTrackerModal } from '../../components/PillConsumptionTrackerModal';
import { Modal } from '../../components/Modal';

export function HealthTrackerPage() {
  const { token, isDemoMode, user } = useAuth();
  const { t } = useLanguage();

  const [trendsData, setTrendsData] = useState({});
  const [selectedBiomarker, setSelectedBiomarker] = useState('blood_glucose');
  const [loading, setLoading] = useState(true);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isLogMetricOpen, setIsLogMetricOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);

  // Medicine Verification & Escalation States (Requirement 2 & 5)
  const [medicationSlots, setMedicationSlots] = useState([]);
  const [adherenceStats, setAdherenceStats] = useState({
    verifiedCount: 0,
    pendingCount: 0,
    missedCount: 0,
    adherencePercentage: 100
  });
  const [alertHistory, setAlertHistory] = useState([]);
  const [selectedCareConnectReminder, setSelectedCareConnectReminder] = useState(null);
  const [isCareConnectOpen, setIsCareConnectOpen] = useState(false);
  const [selectedTrackingReminder, setSelectedTrackingReminder] = useState(null);
  const [isPillTrackerOpen, setIsPillTrackerOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bannerAlert, setBannerAlert] = useState(null);

  // New Medicine Schedule Form
  const [newMedForm, setNewMedForm] = useState({
    medicine_name: '',
    dosage: '',
    frequency: 'Once daily',
    reminder_time: '08:00 AM',
    instructions: 'Take after breakfast with water'
  });

  // Manual log form
  const [metricForm, setMetricForm] = useState({
    metric_type: 'blood_glucose',
    metric_value: '',
    secondary_value: '',
    unit: 'mg/dL',
    notes: ''
  });

  useEffect(() => {
    fetchHealthTrackerData();
    fetchMedicationVerificationData();

    // Auto-poll every 3.5s for real-time status changes
    const pollTimer = setInterval(() => {
      fetchMedicationVerificationData();
    }, 3500);

    const handleUpdate = () => {
      fetchMedicationVerificationData();
      fetchHealthTrackerData();
    };
    window.addEventListener('vitacare:data-updated', handleUpdate);
    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('vitacare:data-updated', handleUpdate);
    };
  }, [token, isDemoMode]);

  const fetchHealthTrackerData = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const res = await fetch('/api/reports/trends', { headers });
      if (res.ok) {
        const data = await res.json();
        setTrendsData(data.trends || {});
      } else {
        setTrendsData(getDefaultTrends());
      }
    } catch (err) {
      console.error('Error fetching health trends:', err);
      setTrendsData(getDefaultTrends());
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicationVerificationData = async () => {
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const res = await fetch('/api/medications', { headers });
      if (res.ok) {
        const data = await res.json();
        const slots = data.todaySlots || [];
        setMedicationSlots(slots);
        if (data.adherence) {
          setAdherenceStats({
            verifiedCount: data.adherence.verifiedCount || data.adherence.takenCount || slots.filter(s => s.status === 'verified').length,
            pendingCount: data.adherence.pendingCount || slots.filter(s => s.status === 'pending').length,
            missedCount: data.adherence.missedCount || 0,
            adherencePercentage: data.adherence.adherencePercentage || 100
          });
        }
        if (data.alertHistory) {
          setAlertHistory(data.alertHistory);
        }
      } else {
        // Fallback default sample for initial visualization
        populateDefaultMedicineSlots();
      }
    } catch (err) {
      console.error('Error fetching medication verification data:', err);
      populateDefaultMedicineSlots();
    }
  };

  const populateDefaultMedicineSlots = () => {
    const defaultSlots = [
      {
        id: 'slot-1',
        reminderId: 'slot-1',
        medicine_name: 'Paracetamol',
        dosage: '500 mg',
        time: '08:00 AM',
        status: 'verified',
        status_display: 'Verified',
        status_badge: '✅ Verified',
        instructions: 'After breakfast'
      },
      {
        id: 'slot-2',
        reminderId: 'slot-2',
        medicine_name: 'Vitamin Tablet',
        dosage: '1 tablet',
        time: '02:00 PM',
        status: 'pending',
        status_display: 'Pending',
        status_badge: '⏳ Pending',
        instructions: 'With afternoon meal'
      }
    ];
    setMedicationSlots(defaultSlots);
    setAdherenceStats({
      verifiedCount: 1,
      pendingCount: 1,
      missedCount: 0,
      adherencePercentage: 50
    });
  };

  /**
  /**
   * Refuse Medicine Slot - Explicit Patient Refusal Workflow
   */
  const handleRefuseMedicineSlot = async (slot) => {
    if (!window.confirm(t.consumptionTracking?.confirmRefusalPrompt || 'Are you sure you want to decline this scheduled medication? This will initiate the patient care escalation workflow.')) {
      return;
    }
    setActionLoadingId(`refuse-${slot.id}`);
    const authToken = token || localStorage.getItem('healthgpt_token');
    try {
      const res = await fetch(`/api/medications/${slot.reminderId || slot.id}/refuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          scheduled_time: slot.time || '08:00 AM',
          reason: 'Patient declined dose'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBannerAlert({
          type: 'warning',
          title: '🚫 Medicine Refusal Logged',
          message: 'Status set to Refused. Patient warning call #1 has been initiated.'
        });
        fetchMedicationVerificationData();
      }
    } catch (err) {
      console.error('Error refusing medicine:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Requirement 5: Test Medicine Alert & Escalation Flow
   * Warning 1 -> Warning 2 -> Guardian Escalation
   */
  const handleTestEscalation = async (slot) => {
    setActionLoadingId(`esc-${slot.id}`);
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const res = await fetch(`/api/medications/${slot.reminderId || slot.id}/escalate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reminder_id: slot.reminderId || slot.id,
          scheduled_time: slot.time || '08:00 AM'
        })
      });

      const data = await res.json();
      if (res.ok) {
        let stageBadge = '';
        let bannerType = 'warning';

        if (data.stage === 'patient_warning_1') {
          stageBadge = '📞 Warning Call #1 Dispatched';
        } else if (data.stage === 'patient_warning_2') {
          stageBadge = '⚠️ Warning Call #2 Dispatched';
        } else if (data.stage === 'guardian_escalation') {
          stageBadge = '🚨 Emergency Guardian Escalation Dispatched!';
          bannerType = 'emergency';
        }

        setBannerAlert({
          type: bannerType,
          title: stageBadge,
          message: data.message || `Escalation event logged for ${slot.medicine_name}.`
        });

        fetchMedicationVerificationData();
      } else {
        alert(data.error || 'Failed to trigger escalation.');
      }
    } catch (err) {
      console.error('Error escalating reminder:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Add new scheduled medicine from modal
   */
  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          medicine_name: newMedForm.medicine_name,
          dosage: newMedForm.dosage,
          frequency: newMedForm.frequency,
          reminder_time: newMedForm.reminder_time,
          instructions: newMedForm.instructions,
          start_date: new Date().toISOString().split('T')[0],
          duration_days: 7
        })
      });

      if (res.ok) {
        setIsAddMedOpen(false);
        setNewMedForm({
          medicine_name: '',
          dosage: '',
          frequency: 'Once daily',
          reminder_time: '08:00 AM',
          instructions: 'Take after meal'
        });
        fetchMedicationVerificationData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to schedule medicine');
      }
    } catch (err) {
      console.error('Error adding medicine schedule:', err);
    }
  };

  const getDefaultTrends = () => {
    return {
      blood_glucose: {
        name: 'Blood Glucose (Fasting)',
        current: { value: 94, unit: 'mg/dL', date: '2026-10-06', refRange: '70 - 99 mg/dL', status: 'normal' },
        previous: { value: 106, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 112 },
          { date: '2026-09-12', metric_value: 106 },
          { date: '2026-10-06', metric_value: 94 }
        ]
      },
      hemoglobin: {
        name: 'Hemoglobin (Hb)',
        current: { value: 14.4, unit: 'g/dL', date: '2026-10-06', refRange: '13.5 - 17.5 g/dL', status: 'normal' },
        previous: { value: 13.8, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 13.2 },
          { date: '2026-09-12', metric_value: 13.8 },
          { date: '2026-10-06', metric_value: 14.4 }
        ]
      },
      blood_pressure: {
        name: 'Blood Pressure',
        current: { value: 118, secondary_value: 78, unit: 'mmHg', date: '2026-10-06', refRange: '< 120/80 mmHg', status: 'normal' },
        previous: { value: 126, secondary_value: 84, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 132, secondary_value: 88 },
          { date: '2026-09-12', metric_value: 126, secondary_value: 84 },
          { date: '2026-10-06', metric_value: 118, secondary_value: 78 }
        ]
      },
      cholesterol: {
        name: 'Total Cholesterol',
        current: { value: 178, unit: 'mg/dL', date: '2026-10-06', refRange: '< 200 mg/dL', status: 'normal' },
        previous: { value: 195, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 205 },
          { date: '2026-09-12', metric_value: 195 },
          { date: '2026-10-06', metric_value: 178 }
        ]
      },
      heart_rate: {
        name: 'Resting Heart Rate',
        current: { value: 72, unit: 'bpm', date: '2026-10-06', refRange: '60 - 100 bpm', status: 'normal' },
        previous: { value: 76, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 78 },
          { date: '2026-09-12', metric_value: 76 },
          { date: '2026-10-06', metric_value: 72 }
        ]
      },
      spo2: {
        name: 'Oxygen Saturation (SpO2)',
        current: { value: 99, unit: '%', date: '2026-10-06', refRange: '> 95 %', status: 'normal' },
        previous: { value: 98, date: '2026-09-12' },
        dataPoints: [
          { date: '2026-08-15', metric_value: 97 },
          { date: '2026-09-12', metric_value: 98 },
          { date: '2026-10-06', metric_value: 99 }
        ]
      }
    };
  };

  const handleSaveManualMetric = async (e) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          metric_type: metricForm.metric_type,
          metric_value: parseFloat(metricForm.metric_value),
          secondary_value: metricForm.secondary_value ? parseFloat(metricForm.secondary_value) : null,
          unit: metricForm.unit,
          notes: metricForm.notes
        })
      });

      setIsLogMetricOpen(false);
      fetchHealthTrackerData();
    } catch (err) {
      console.error('Error logging metric:', err);
    }
  };

  const currentTrendItem = trendsData[selectedBiomarker] || trendsData.blood_glucose;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* HEADER WITH TITLE & ACTION BUTTONS */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.25rem 1.75rem',
          border: '1.5px solid #e0f2fe',
          boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}
            >
              VitaCare Health Tracker & Clinical Biometrics
            </span>
          </div>
          <h1 style={{ margin: '0.3rem 0 0.15rem', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            {t.tracker?.title || 'Health Tracker & Medicine Verification'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
            {t.tracker?.subtitle || 'Dynamic medicine adherence verification and automated guardian notification system.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddMedOpen(true)}
            style={{
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #0284c7',
              color: '#0284c7',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Pill size={16} /> + Schedule Medicine
          </button>

          <button
            onClick={() => setIsLogMetricOpen(true)}
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus size={16} /> + Log Metric
          </button>

          <button
            onClick={() => setIsAddReportOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <FilePlus size={16} /> + ADD HEALTH REPORT
          </button>
        </div>
      </div>

      {/* DYNAMIC ALERT BANNER */}
      {bannerAlert && (
        <div
          style={{
            backgroundColor: bannerAlert.type === 'emergency' ? '#fef2f2' : bannerAlert.type === 'warning' ? '#fffbeb' : '#f0fdf4',
            border: `1.5px solid ${bannerAlert.type === 'emergency' ? '#f87171' : bannerAlert.type === 'warning' ? '#fcd34d' : '#86efac'}`,
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {bannerAlert.type === 'emergency' ? (
              <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : bannerAlert.type === 'warning' ? (
              <PhoneCall size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: 800, color: bannerAlert.type === 'emergency' ? '#991b1b' : bannerAlert.type === 'warning' ? '#92400e' : '#166534', fontSize: '0.98rem' }}>
                {bannerAlert.title}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '0.2rem' }}>
                {bannerAlert.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* REQUIREMENT 2 & 5: HEALTH TRACKER - MEDICINE VERIFICATION & ESCALATION SECTION */}
      {/* ========================================================================================= */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1.5px solid #bae6fd',
          boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.1)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={20} color="#0284c7" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {t.tracker?.medicineVerification || 'Medicine Verification & Adherence Status'}
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Every scheduled medicine is tracked dynamically. Confirmed doses notify your registered guardian. Unconfirmed doses escalate via warning calls.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
              ✅ {adherenceStats.verifiedCount} Verified
            </span>
            <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #fde68a' }}>
              ⏳ {adherenceStats.pendingCount} Pending
            </span>
            {adherenceStats.missedCount > 0 && (
              <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #fecaca' }}>
                ❌ {adherenceStats.missedCount} Missed
              </span>
            )}
          </div>
        </div>

        {/* SCHEDULED MEDICINES TABLE (Requirement 2) */}
        <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem' }}>{t.tracker?.medicineName || 'Medicine Name'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t.tracker?.dosage || 'Dosage'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t.tracker?.scheduledTime || 'Scheduled Time'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t.tracker?.status || 'Status'}</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>{t.tracker?.action || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {medicationSlots.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <Pill size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No medicines scheduled for today.</p>
                    <button
                      onClick={() => setIsAddMedOpen(true)}
                      style={{ marginTop: '0.75rem', padding: '0.45rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Scheduled Medicine
                    </button>
                  </td>
                </tr>
              ) : (
                medicationSlots.map((slot) => {
                  const isVerified = slot.status === 'verified' || slot.status === 'taken';
                  const isPending = slot.status === 'pending' || slot.status === 'upcoming';
                  const isMissed = slot.status === 'missed';

                  return (
                    <tr
                      key={slot.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isVerified ? '#fafffd' : isPending ? '#fffdfa' : '#ffffff',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>💊</span>
                          <div>
                            <div>{slot.medicine_name || slot.medicineName}</div>
                            {slot.instructions && (
                              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                                {slot.instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem', color: '#334155', fontWeight: 600 }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '0.35rem' }}>
                          {slot.dosage}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={15} color="#0284c7" />
                          <span>{slot.time || slot.scheduled_time || '08:00 AM'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {isVerified && (
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            ✅ Verified
                          </span>
                        )}

                        {isPending && (
                          <span
                            style={{
                              backgroundColor: '#fffbeb',
                              color: '#d97706',
                              border: '1px solid #fde68a',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            ⏳ Pending
                          </span>
                        )}

                        {isMissed && (
                          <span
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            ❌ Missed
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isVerified ? (
                            <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle2 size={15} /> {t.medicine?.verified || 'Intake Verified'}
                            </span>
                          ) : slot.status === 'refused' ? (
                            <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <XCircle size={15} /> {t.medicine?.refused || 'Refused'}
                            </span>
                          ) : (
                            <>
                              {/* Automated Camera Pill Tracking Button */}
                              <button
                                onClick={() => {
                                  setSelectedTrackingReminder(slot);
                                  setIsPillTrackerOpen(true);
                                }}
                                style={{
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.45rem 0.9rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                                }}
                                title="Start automated camera pill consumption tracking"
                              >
                                <Camera size={14} />
                                {t.tracker?.startTracking || 'Track Pill Consumption'}
                              </button>

                              {/* Refuse Medicine Option */}
                              <button
                                onClick={() => handleRefuseMedicineSlot(slot)}
                                disabled={actionLoadingId === `refuse-${slot.id}`}
                                style={{
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '0.5rem',
                                  padding: '0.45rem 0.75rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                                title="Refuse scheduled medicine and trigger escalation"
                              >
                                <XCircle size={14} />
                                {t.tracker?.refuseDose || 'Refuse'}
                              </button>

                              {/* Test Warning / Escalation Simulation Button (Requirement 5) */}
                              <button
                                onClick={() => handleTestEscalation(slot)}
                                disabled={actionLoadingId === `esc-${slot.id}`}
                                style={{
                                  backgroundColor: '#fffbeb',
                                  color: '#b45309',
                                  border: '1.5px solid #fcd34d',
                                  borderRadius: '0.5rem',
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                                title="Simulate patient non-response: Warning #1 -> Warning #2 -> Guardian Escalation"
                              >
                                <PhoneCall size={14} />
                                {actionLoadingId === `esc-${slot.id}` ? 'Calling...' : 'Test Warning'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ALERT & ESCALATION HISTORY TABLE (Requirement 5) */}
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <Bell size={18} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {t.tracker?.alertHistory || 'Alert & Guardian Notification History'}
            </h3>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e2e8f0', maxHeight: '220px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Time</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Alert Stage</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Recipient</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Dispatched Message</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Channel</th>
                </tr>
              </thead>
              <tbody>
                {alertHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      No alerts dispatched yet today. Confirmed intakes or warnings will appear here.
                    </td>
                  </tr>
                ) : (
                  alertHistory.map((alert) => (
                    <tr key={alert.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        {alert.alert_type === 'intake_verified' ? (
                          <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
                            Intake Verified
                          </span>
                        ) : alert.alert_type === 'patient_warning_1' ? (
                          <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
                            Warning Call #1
                          </span>
                        ) : alert.alert_type === 'patient_warning_2' ? (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
                            Warning Call #2
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
                            🚨 Guardian Escalation
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                        {alert.recipient_name || 'Guardian'} ({alert.recipient_phone || 'Phone'})
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#0f172a' }}>
                        {alert.message}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>
                        {alert.channel || 'SMS'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* CLINICAL BIOMETRICS & LONGITUDINAL TRENDS */}
      {/* ========================================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {Object.entries(trendsData).map(([key, item]) => {
          const isSelected = selectedBiomarker === key;
          const currentVal = item.current?.value;
          const prevVal = item.previous?.value;
          const isImproved = prevVal ? currentVal < prevVal : false;

          return (
            <div
              key={key}
              onClick={() => setSelectedBiomarker(key)}
              style={{
                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                borderRadius: '0.85rem',
                padding: '1.15rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected
                  ? '0 6px 18px -4px rgba(2, 132, 199, 0.25)'
                  : '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#0284c7' : '#475569' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px'
                  }}
                >
                  Normal
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {item.current?.value}
                  {item.current?.secondary_value ? `/${item.current.secondary_value}` : ''}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                  {item.current?.unit}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Ref: {item.current?.refRange}</span>
                {prevVal && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: isImproved ? '#059669' : '#0284c7', fontWeight: 600 }}>
                    {isImproved ? <TrendingDown size={14} /> : <TrendingUp size={14} />} Prev: {prevVal}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED TREND GRAPH */}
      {currentTrendItem && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {currentTrendItem.name} — Historical Trend & Reference Range
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Target range: {currentTrendItem.current?.refRange} • Last updated: {currentTrendItem.current?.date}
              </p>
            </div>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <MetricChart
              data={currentTrendItem.dataPoints || []}
              metricName={currentTrendItem.name}
              unit={currentTrendItem.current?.unit || ''}
            />
          </div>
        </div>
      )}

      {/* QUICK ADD SCHEDULED MEDICINE MODAL */}
      <Modal isOpen={isAddMedOpen} onClose={() => setIsAddMedOpen(false)} title="Schedule New Medication">
        <form onSubmit={handleAddMedicineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Medicine Name *
            </label>
            <input
              type="text"
              required
              value={newMedForm.medicine_name}
              onChange={(e) => setNewMedForm({ ...newMedForm, medicine_name: e.target.value })}
              placeholder="e.g. Paracetamol, Metformin"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Dosage *
              </label>
              <input
                type="text"
                required
                value={newMedForm.dosage}
                onChange={(e) => setNewMedForm({ ...newMedForm, dosage: e.target.value })}
                placeholder="e.g. 500mg, 1 tablet"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Scheduled Time *
              </label>
              <input
                type="text"
                required
                value={newMedForm.reminder_time}
                onChange={(e) => setNewMedForm({ ...newMedForm, reminder_time: e.target.value })}
                placeholder="e.g. 08:00 AM, 02:00 PM"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Instructions
            </label>
            <input
              type="text"
              value={newMedForm.instructions}
              onChange={(e) => setNewMedForm({ ...newMedForm, instructions: e.target.value })}
              placeholder="e.g. After meals with water"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddMedOpen(false)}
              style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Save Medicine Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* CARE CONNECT REAL CAMERA MODAL */}
      <CareConnectModal
        isOpen={isCareConnectOpen}
        onClose={() => setIsCareConnectOpen(false)}
        reminder={selectedCareConnectReminder}
        onAdherenceConfirmed={() => {
          setIsCareConnectOpen(false);
          fetchMedicationVerificationData();
        }}
      />

      {/* ADD HEALTH REPORT MODAL */}
      <AddHealthReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        onReportSaved={() => {
          setIsAddReportOpen(false);
          fetchHealthTrackerData();
        }}
      />

      {/* Manual Metric Modal */}
      <Modal isOpen={isLogMetricOpen} onClose={() => setIsLogMetricOpen(false)} title="Log Health Metric">
        <form onSubmit={handleSaveManualMetric} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Metric Type
            </label>
            <select
              value={metricForm.metric_type}
              onChange={(e) => {
                const type = e.target.value;
                const units = {
                  blood_glucose: 'mg/dL',
                  hemoglobin: 'g/dL',
                  blood_pressure: 'mmHg',
                  cholesterol: 'mg/dL',
                  heart_rate: 'bpm',
                  spo2: '%'
                };
                setMetricForm({ ...metricForm, metric_type: type, unit: units[type] || '' });
              }}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            >
              <option value="blood_glucose">Blood Glucose (mg/dL)</option>
              <option value="hemoglobin">Hemoglobin (g/dL)</option>
              <option value="blood_pressure">Blood Pressure (mmHg)</option>
              <option value="cholesterol">Total Cholesterol (mg/dL)</option>
              <option value="heart_rate">Heart Rate (bpm)</option>
              <option value="spo2">Oxygen Saturation (%)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: metricForm.metric_type === 'blood_pressure' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {metricForm.metric_type === 'blood_pressure' ? 'Systolic Value' : 'Measurement Value'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={metricForm.metric_value}
                onChange={(e) => setMetricForm({ ...metricForm, metric_value: e.target.value })}
                placeholder="e.g. 95"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            {metricForm.metric_type === 'blood_pressure' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Diastolic Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={metricForm.secondary_value}
                  onChange={(e) => setMetricForm({ ...metricForm, secondary_value: e.target.value })}
                  placeholder="e.g. 75"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Notes / Observation
            </label>
            <input
              type="text"
              value={metricForm.notes}
              onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })}
              placeholder="e.g. Taken post morning fasting"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsLogMetricOpen(false)}
              style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Save Metric
            </button>
          </div>
        </form>
      </Modal>

      {/* Pill Consumption Tracker Modal */}
      <PillConsumptionTrackerModal
        isOpen={isPillTrackerOpen}
        onClose={() => setIsPillTrackerOpen(false)}
        reminder={selectedTrackingReminder}
        onVerificationComplete={() => fetchMedicationVerificationData()}
      />
    </div>
  );
}
