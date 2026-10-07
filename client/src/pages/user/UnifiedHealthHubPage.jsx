import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileText,
  Pill,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Upload,
  PhoneCall,
  Video,
  Users,
  Shield,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  Calendar,
  ChevronRight,
  BarChart2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmergencySosModal } from '../../components/EmergencySosModal';
import { DemoCallModal } from '../../components/DemoCallModal';
import { PillConsumptionTrackerModal } from '../../components/PillConsumptionTrackerModal';
import { ReportUploadModal } from '../../components/ReportUploadModal';
import { ReportComparisonModal } from '../../components/ReportComparisonModal';
import { GuardianManagerModal } from '../../components/GuardianManagerModal';

export function UnifiedHealthHubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reports' | 'timeline' | 'medications' | 'safety'
  const [loading, setLoading] = useState(true);

  // Data states
  const [reports, setReports] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [biomarkerTrends, setBiomarkerTrends] = useState({});
  const [reminders, setReminders] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [healthProfile, setHealthProfile] = useState({});
  const [guardians, setGuardians] = useState([]);
  const [metrics, setMetrics] = useState([]);

  // Modal states
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDemoCallOpen, setIsDemoCallOpen] = useState(false);
  const [isVideoVerifyOpen, setIsVideoVerifyOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGuardianOpen, setIsGuardianOpen] = useState(false);

  // Selected entities for modals
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState(null);

  useEffect(() => {
    fetchAllHubData();
  }, []);

  const fetchAllHubData = async () => {
    setLoading(true);
    const token = localStorage.getItem('healthgpt_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [
        reportsRes,
        timelineRes,
        medsRes,
        profileRes,
        guardiansRes,
        metricsRes
      ] = await Promise.all([
        fetch('/api/reports', { headers }).then(r => r.ok ? r.json() : { reports: [] }),
        fetch('/api/reports/timeline', { headers }).then(r => r.ok ? r.json() : { timeline: [], biomarkerTrends: {} }),
        fetch('/api/medications', { headers }).then(r => r.ok ? r.json() : { reminders: [], todayLogs: [] }),
        fetch('/api/user/health-profile', { headers }).then(r => r.ok ? r.json() : { profile: {} }),
        fetch('/api/guardians', { headers }).then(r => r.ok ? r.json() : { guardians: [] }),
        fetch('/api/metrics', { headers }).then(r => r.ok ? r.json() : { metrics: [] })
      ]);

      setReports(reportsRes.reports || []);
      setTimelineEvents(timelineRes.timeline || []);
      setBiomarkerTrends(timelineRes.biomarkerTrends || {});
      setReminders(medsRes.reminders || []);
      setTodayLogs(medsRes.todayLogs || []);
      setHealthProfile(profileRes.profile || {});
      setGuardians(guardiansRes.guardians || []);
      setMetrics(metricsRes.metrics || []);
    } catch (err) {
      console.error('Error fetching hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDemoCall = (reminder) => {
    setSelectedReminder(reminder);
    setIsDemoCallOpen(true);
  };

  const handleOpenVideoVerify = (reminder) => {
    setSelectedReminder(reminder);
    setIsVideoVerifyOpen(true);
  };

  const handleOpenComparison = async (report) => {
    const token = localStorage.getItem('healthgpt_token');
    try {
      const res = await fetch(`/api/reports/${report.id}/compare`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedComparison({
          ...data,
          currentReport: report
        });
        setIsCompareOpen(true);
      }
    } catch (err) {
      alert(`Could not generate comparison: ${err.message}`);
    }
  };

  // Find latest report
  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      {/* Top Banner & Quick Emergency SOS Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Unified Health Dashboard & Reports
            </h1>
            <span className="badge badge-primary">Comprehensive Clinical Hub</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Unified view of lifetime reports, biomarker trajectories, medication reminders, and emergency care.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* HIGHLY VISIBLE EMERGENCY SOS BUTTON */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="btn"
            style={{
              backgroundColor: 'var(--danger-500)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              animation: 'pulse 2s infinite'
            }}
          >
            <AlertTriangle size={18} />
            EMERGENCY SOS
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}
          >
            <Upload size={16} /> Upload / Update Report
          </button>

          <button
            onClick={() => setIsGuardianOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}
          >
            <Users size={16} /> Guardians ({guardians.length})
          </button>
        </div>
      </div>

      {/* Patient Health Snapshot Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Clinical Profile
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Blood Group: {healthProfile.blood_group || 'O+'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Allergies: <strong>{healthProfile.allergies || 'None reported'}</strong>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Active Medications
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-600)' }}>
            {reminders.length} Scheduled
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Today's Logs: <strong>{todayLogs.filter(l => l.status === 'taken').length} Taken</strong>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Medical Reports On File
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
            {reports.length} Reports
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Latest: {latestReport ? `${latestReport.report_date} (v${latestReport.version})` : 'No reports yet'}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            Guardian Safety Net
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: guardians.length > 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {guardians.length > 0 ? `${guardians.length} Configured` : 'Not Set'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Auto Missed-Dose Alarms: <strong>Active</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-medium)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'Master Overview & AI Summary', icon: Activity },
          { id: 'reports', label: `Medical Reports & Comparison (${reports.length})`, icon: FileText },
          { id: 'timeline', label: `Lifetime Timeline (${timelineEvents.length})`, icon: Clock },
          { id: 'medications', label: `Medicines & Video Adherence (${reminders.length})`, icon: Pill },
          { id: 'safety', label: 'Safety Net & Guardian Alerts', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid var(--primary-600)' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: MASTER OVERVIEW & AI SUMMARY */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
          <div>
            {/* AI Lifetime Health Trajectory Summary */}
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)', marginBottom: '0.75rem' }}>
                <Sparkles size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  AI Clinical Trajectory Summary (Layman Guidance)
                </h3>
              </div>

              {latestReport?.ai_summary ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {latestReport.ai_summary}
                  </p>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    Based on your verified medical records. HealthGPT assists with layman education and cannot independently alter therapy.
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No medical reports uploaded yet. Click <strong>"Upload / Update Report"</strong> above to extract indicators and receive tailored AI health guidance.
                </div>
              )}
            </div>

            {/* Key Biomarkers Over Time Preview Cards */}
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Lifetime Biomarker Trajectories
                </h3>
                <button onClick={() => setActiveTab('timeline')} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-600)' }}>
                  View Full Timeline <ChevronRight size={14} />
                </button>
              </div>

              {Object.keys(biomarkerTrends).length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No extracted biomarkers recorded. Upload a lab report or prescription to start lifetime tracking.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(biomarkerTrends).slice(0, 4).map(([key, data]) => {
                    const latestPt = data.points[data.points.length - 1];
                    const prevPt = data.points.length > 1 ? data.points[data.points.length - 2] : null;
                    const delta = prevPt ? (latestPt.value - prevPt.value).toFixed(1) : null;

                    return (
                      <div key={key} style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-muted)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {data.name}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {latestPt.value} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>{data.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: latestPt.status === 'normal' ? 'var(--accent-emerald)' : 'var(--danger-600)', fontWeight: 600 }}>
                          {latestPt.status.toUpperCase()} • Ref: {data.reference_range}
                        </div>
                        {delta && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {delta > 0 ? `+${delta}` : delta} from prior test
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Today's Medication Reminders with Call & Video verification */}
          <div>
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Pill size={18} style={{ color: 'var(--primary-600)' }} />
                  Medicine Reminders Today
                </h3>
              </div>

              {reminders.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No active medicine reminders. Schedule your medications in the Medicines tab.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {reminders.map(rem => {
                    const isTakenToday = todayLogs.some(l => l.reminder_id === rem.id && l.status === 'taken');

                    return (
                      <div key={rem.id} style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 700, textTransform: 'uppercase' }}>
                              Time: {rem.reminder_time}
                            </div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {rem.medicine_name}
                            </strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Dosage: {rem.dosage} ({rem.frequency})
                            </div>
                          </div>

                          {isTakenToday ? (
                            <span className="badge badge-primary" style={{ backgroundColor: 'var(--accent-emerald)', color: '#fff' }}>
                              <CheckCircle2 size={12} /> Taken
                            </span>
                          ) : (
                            <span className="badge badge-demo">Pending</span>
                          )}
                        </div>

                        {/* Interactive Verification Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                          <button
                            onClick={() => handleOpenDemoCall(rem)}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            title="Simulate scheduled incoming phone call reminder"
                          >
                            <PhoneCall size={13} /> Demo Call
                          </button>

                          <button
                            onClick={() => handleOpenVideoVerify(rem)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1.2, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            title="Proceed to camera video verification session"
                          >
                            <Video size={13} /> Video Verify
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MEDICAL REPORTS & COMPARISON */}
      {activeTab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Medical Records Archive & Version Revision Chains
            </h3>
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Upload New Report / Add Revision
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={{
              padding: '3rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-medium)',
              textAlign: 'center'
            }}>
              <FileText size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                No Medical Reports Uploaded
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.5rem 0 1.25rem' }}>
                Upload your blood tests, prescriptions, scans, or discharge summaries to extract biomarkers and enable historical trajectory tracking.
              </p>
              <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary btn-sm">
                Upload First Report
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.map((report) => (
                <div key={report.id} style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{report.title}</strong>
                        <span className="badge badge-primary">Version {report.version || 1}</span>
                        <span className="badge badge-demo">{report.report_type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Date: {report.report_date} • Physician: {report.doctor_name || 'Unspecified'} • Facility: {report.facility_name || 'Diagnostic Lab'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenComparison(report)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                      >
                        <BarChart2 size={14} /> Compare Against Prior
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  {report.ai_summary && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-muted)',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>AI Layperson Summary: </strong>
                      {report.ai_summary}
                    </div>
                  )}

                  {/* Biomarkers extracted tags */}
                  {report.extracted_data?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {report.extracted_data.map((bio, idx) => (
                        <span key={idx} className="badge badge-primary" style={{ fontSize: '0.785rem' }}>
                          {bio.name}: <strong>{bio.value} {bio.unit}</strong> ({bio.status})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: LIFETIME HEALTH TIMELINE */}
      {activeTab === 'timeline' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Chronological Lifetime Health Timeline
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Historical progression of laboratory reports, physician visits, and vital measurements.
            </p>
          </div>

          {timelineEvents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No timeline events recorded yet. Upload reports or log vital measurements to build your lifetime stream.
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--primary-200)', display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
              {timelineEvents.map((evt, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Timeline bullet dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-2.6rem',
                    top: '4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: evt.type === 'medical_report' ? 'var(--primary-600)' : 'var(--accent-teal)',
                    border: '3px solid #fff',
                    boxShadow: '0 0 0 2px var(--primary-200)'
                  }} />

                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                        {evt.date}
                      </span>
                      <span className="badge badge-demo">{evt.subtitle}</span>
                    </div>

                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {evt.title}
                    </strong>

                    {evt.doctor && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Physician: {evt.doctor} {evt.facility ? `• ${evt.facility}` : ''}
                      </div>
                    )}

                    {evt.details && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                        {evt.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: MEDICATIONS & VIDEO ADHERENCE */}
      {activeTab === 'medications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Medication Schedules & Video Adherence
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Configurable schedules, automated telephone reminder alerts, and self-attested video verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {reminders.map(rem => (
              <div key={rem.id} style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Scheduled: {rem.reminder_time}
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {rem.medicine_name}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Dosage: <strong>{rem.dosage}</strong> • Frequency: {rem.frequency}
                    </div>
                  </div>
                  <span className="badge badge-primary">{rem.status}</span>
                </div>

                {rem.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    "{rem.notes}"
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleOpenDemoCall(rem)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <PhoneCall size={14} /> Trigger Call
                  </button>
                  <button
                    onClick={() => handleOpenVideoVerify(rem)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Video size={14} /> Video Session
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Adherence Logs History */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Today's Adherence Activity Log
            </h4>
            {todayLogs.length === 0 ? (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No dose activities recorded today yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayLogs.map(log => (
                  <div key={log.id} style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{log.medicine_name}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        Scheduled: {log.scheduled_time} • Verification: {log.verification_mode || 'self'}
                      </span>
                    </div>
                    <span className={`badge ${log.status === 'taken' ? 'badge-primary' : 'badge-danger'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: SAFETY NET & GUARDIAN ALERTS */}
      {activeTab === 'safety' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Guardian Safety Net & Emergency Escalation
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Family caregiver management and dual-contact emergency SOS dispatching.
              </p>
            </div>
            <button onClick={() => setIsGuardianOpen(true)} className="btn btn-primary btn-sm">
              Manage Guardians
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Guardians Card */}
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={18} style={{ color: 'var(--primary-600)' }} /> Configured Guardians ({guardians.length})
              </h4>
              {guardians.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No guardians registered yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {guardians.map(g => (
                    <div key={g.id} style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{g.name} ({g.relation})</strong>
                        <span className="badge badge-demo">Escalation ({g.escalation_timeout_mins}m)</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                        Phone: {g.phone} {g.email ? `• ${g.email}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency SOS Control Card */}
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger-600)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={18} /> Emergency Dual-Dispatch System
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                When activated, dual emergency messages are prepared for:
                <br /><strong>Contact 1:</strong> National Ambulance (108 / 911)
                <br /><strong>Contact 2:</strong> Designated Guardian
                <br />Includes blood group, drug allergies, active medicines, and location coordinates.
              </p>
              <button
                onClick={() => setIsSosOpen(true)}
                className="btn btn-primary"
                style={{
                  backgroundColor: 'var(--danger-500)',
                  borderColor: 'var(--danger-500)',
                  width: '100%',
                  fontWeight: 700
                }}
              >
                Open Emergency SOS Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOGS */}
      <EmergencySosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
      />

      <ReportUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingReports={reports}
        onReportSaved={() => fetchAllHubData()}
      />

      <ReportComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparisonData={selectedComparison}
      />

      <DemoCallModal
        isOpen={isDemoCallOpen}
        onClose={() => setIsDemoCallOpen(false)}
        reminder={selectedReminder}
        onProceedToVideo={(rem) => {
          setSelectedReminder(rem);
          setIsVideoVerifyOpen(true);
        }}
      />

      <PillConsumptionTrackerModal
        isOpen={isVideoVerifyOpen}
        onClose={() => setIsVideoVerifyOpen(false)}
        reminder={selectedReminder}
        onVerificationComplete={() => fetchAllHubData()}
      />

      <GuardianManagerModal
        isOpen={isGuardianOpen}
        onClose={() => setIsGuardianOpen(false)}
      />
    </div>
  );
}
