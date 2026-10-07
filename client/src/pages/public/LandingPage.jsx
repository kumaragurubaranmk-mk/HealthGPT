import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Bot,
  Stethoscope,
  Pill,
  ShieldCheck,
  Video,
  FilePlus,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  LineChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';

export function LandingPage() {
  const { toggleDemoMode } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 2rem 4rem',
          background: 'radial-gradient(ellipse at top, rgba(2, 132, 199, 0.12) 0%, rgba(248, 250, 252, 0) 70%)',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '940px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.15rem',
              borderRadius: '9999px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Sparkles size={16} /> Personal Health Copilot • OCR + AI Clinical Intelligence
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
              fontWeight: 900,
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: '#0f172a'
            }}
          >
            VitaCare <span style={{ color: '#0284c7' }}>AI</span>
          </h1>

          <div
            style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              fontWeight: 700,
              color: '#0369a1',
              marginBottom: '1.25rem'
            }}
          >
            "Your Health. Organized. Intelligent. Connected."
          </div>

          <p
            style={{
              fontSize: '1.15rem',
              color: '#475569',
              maxWidth: '740px',
              margin: '0 auto 2.25rem',
              lineHeight: '1.6'
            }}
          >
            Organize medical records, prescriptions, health reports, medicines, and vitals in one intelligent platform with OCR extraction, interactive timelines, and CareConnect™ supervised adherence.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <Link
              to="/dashboard"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '0.85rem 1.75rem',
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
              }}
            >
              Open Health Dashboard <ArrowRight size={18} />
            </Link>

            <button
              onClick={toggleDemoMode}
              style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #0284c7',
                color: '#0284c7',
                padding: '0.85rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={18} /> Launch 1-Click Demo Evaluation
            </button>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem 2.5rem' }}>
        <MedicalDisclaimer />
      </section>

      {/* 4 Feature Pillars Grid */}
      <section style={{ padding: '3rem 2rem 5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Built for Real-World Clinical Adherence
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            From document upload to verified biometric trends and supervised video check-ins.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem' }}>
          {/* Card 1: OCR Extraction & Auto-Profile */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <FilePlus size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              OCR & AI Extraction
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Upload lab reports and prescriptions. Extracts vitals, medicines, dosages, and reference intervals with mandatory user verification before saving.
            </p>
          </div>

          {/* Card 2: Health Tracker & Trends */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Longitudinal Health Trends
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Interactive historical line charts for Blood Glucose, Hemoglobin, Blood Pressure, and Cholesterol with previous result comparison and standard intervals.
            </p>
          </div>

          {/* Card 3: CareConnect Supervised Video */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Video size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              CareConnect™ Video Check-In
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Supervised adherence video sessions with authorized caregivers. Full patient autonomy, emergency end-call capability, and verified intake recording.
            </p>
          </div>

          {/* Card 4: AI Health Copilot */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                backgroundColor: '#f3e8ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              AI Health Copilot
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Instant answers grounded in your active prescriptions and lab values. Clearly distinguishes extracted data from educational guidance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
