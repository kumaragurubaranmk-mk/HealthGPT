import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';

export function TermsPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3.5rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <FileText size={28} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Terms of Clinical Guidance</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Educational Platform Agreement & Medical Boundaries
        </p>
      </div>

      <MedicalDisclaimer />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2.5rem', lineHeight: '1.75', color: 'var(--text-secondary)' }}>
        <section>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            1. Non-Diagnostic Educational Scope
          </h3>
          <p>
            HealthGPT is designed exclusively as an <strong>educational tool and informational assistant</strong> for college, hackathon, and prototype evaluations. Under no circumstances does this software establish a doctor-patient relationship, issue binding medical diagnoses, or prescribe regulated medications.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            2. Emergency Disclaimer
          </h3>
          <p>
            Do not use HealthGPT for acute, life-threatening emergencies. If you believe you are experiencing a heart attack, stroke, acute trauma, or allergic anaphylaxis, dial <strong>108 / 112</strong> (India) or <strong>911</strong> (US) immediately.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            3. User Responsibility
          </h3>
          <p>
            You are solely responsible for verifying any health suggestions with a licensed healthcare practitioner before altering medication regimens, diet, or treatment plans.
          </p>
        </section>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link to="/" className="btn btn-secondary">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
