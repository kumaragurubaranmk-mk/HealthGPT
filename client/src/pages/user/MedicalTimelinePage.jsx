import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Pill,
  CheckCircle2,
  Calendar,
  Activity,
  Sparkles,
  Filter,
  ArrowRight,
  ShieldCheck,
  Video
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MedicalTimelinePage() {
  const { token, isDemoMode } = useAuth();
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'report' | 'prescription' | 'medication' | 'measurement'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [token, isDemoMode]);

  const fetchTimeline = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const res = await fetch('/api/timeline', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.timeline && data.timeline.length > 0) {
          setTimelineEvents(data.timeline);
        } else {
          setTimelineEvents(getDefaultTimeline());
        }
      } else {
        setTimelineEvents(getDefaultTimeline());
      }
    } catch (err) {
      console.error('Error fetching medical timeline:', err);
      setTimelineEvents(getDefaultTimeline());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTimeline = () => [
    {
      id: 'tl-1',
      event_type: 'report',
      title: 'Blood Report Uploaded & Analyzed',
      description: 'Extracted Hemoglobin (14.4 g/dL), Fasting Glucose (94 mg/dL), Total Cholesterol (178 mg/dL). All ranges normal.',
      event_date: 'October 6, 2026',
      event_time: '10:15 AM',
      icon_type: 'report',
      status_badge: 'Verified Report'
    },
    {
      id: 'tl-2',
      event_type: 'prescription',
      title: 'Prescription Added by Dr. Michael Chen',
      description: 'Extracted Amoxicillin 500mg (BID, 5 days) and Multivitamin daily. Auto-generated medicine schedule.',
      event_date: 'October 6, 2026',
      event_time: '11:30 AM',
      icon_type: 'prescription',
      status_badge: 'Active Rx'
    },
    {
      id: 'tl-3',
      event_type: 'medication',
      title: 'Medicine Scheduled: Amoxicillin 500mg',
      description: 'Morning dose timed at 08:00 AM with food. Supervised adherence alert configured.',
      event_date: 'October 7, 2026',
      event_time: '08:00 AM',
      icon_type: 'scheduled',
      status_badge: 'Scheduled'
    },
    {
      id: 'tl-4',
      event_type: 'medication',
      title: 'Medication Confirmed (CareConnect Supervised)',
      description: 'Dose intake verified via live CareConnect video session with Nurse Elena Vance.',
      event_date: 'October 7, 2026',
      event_time: '08:02 AM',
      icon_type: 'confirmed',
      status_badge: 'Confirmed Taken'
    },
    {
      id: 'tl-5',
      event_type: 'measurement',
      title: 'Vitals Recorded: BP 118/78 mmHg, HR 72 bpm',
      description: 'Resting cardiovascular parameters within optimal baseline range.',
      event_date: 'October 7, 2026',
      event_time: '09:00 AM',
      icon_type: 'measurement',
      status_badge: 'Normal Vitals'
    },
    {
      id: 'tl-6',
      event_type: 'medication',
      title: 'Medicine Course Scheduled to Complete',
      description: 'Target completion for 5-day Amoxicillin course.',
      event_date: 'October 12, 2026',
      event_time: '08:00 PM',
      icon_type: 'completed',
      status_badge: 'Planned Course End'
    }
  ];

  const filteredEvents = timelineEvents.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.event_type === filterType;
  });

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'report':
        return <FileText size={18} color="#0284c7" />;
      case 'prescription':
        return <Pill size={18} color="#0ea5e9" />;
      case 'scheduled':
        return <Clock size={18} color="#f59e0b" />;
      case 'confirmed':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'completed':
        return <Calendar size={18} color="#8b5cf6" />;
      case 'measurement':
        return <Activity size={18} color="#ec4899" />;
      default:
        return <Clock size={18} color="#0284c7" />;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* HEADER */}
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
              Lifetime Longitudinal Record
            </span>
          </div>
          <h1 style={{ margin: '0.3rem 0 0.15rem', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Medical Timeline
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
            Complete chronological chronicle combining reports, prescriptions, medicine events, and telemetry.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'report', label: 'Reports' },
            { id: 'prescription', label: 'Prescriptions' },
            { id: 'medication', label: 'Medications' },
            { id: 'measurement', label: 'Vitals' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: filterType === btn.id ? 700 : 500,
                backgroundColor: filterType === btn.id ? '#0284c7' : '#f8fafc',
                color: filterType === btn.id ? '#ffffff' : '#475569',
                border: `1px solid ${filterType === btn.id ? '#0284c7' : '#cbd5e1'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE CONTAINER */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem 1.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative'
        }}
      >
        {/* Continuous vertical timeline connector line */}
        <div
          style={{
            position: 'absolute',
            left: '3rem',
            top: '2.5rem',
            bottom: '2.5rem',
            width: '2px',
            backgroundColor: '#e2e8f0',
            zIndex: 0
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative', zIndex: 1 }}>
          {filteredEvents.map((ev, index) => (
            <div
              key={ev.id || index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem'
              }}
            >
              {/* Event Icon Pin */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '2px solid #0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                  flexShrink: 0
                }}
              >
                {getIcon(ev.icon_type)}
              </div>

              {/* Event Content Card */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.85rem',
                  padding: '1rem 1.25rem',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {ev.title}
                    </h3>
                    {ev.status_badge && (
                      <span
                        style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}
                      >
                        {ev.status_badge}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    {ev.event_date} {ev.event_time ? `• ${ev.event_time}` : ''}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.45 }}>
                  {ev.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
