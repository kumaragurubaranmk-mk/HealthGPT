import React from 'react';
import { ShieldCheck, Lock, Download, Trash2, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3.5rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
          <ShieldCheck size={30} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Privacy & Data Architecture Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Transparent, accountable, and strictly user-controlled health data stewardship.
        </p>
      </div>

      <div className="card" style={{
        backgroundColor: 'var(--primary-50)',
        border: '1.5px solid var(--primary-500)',
        padding: '1.75rem',
        marginBottom: '2.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--primary-700)', marginBottom: '0.5rem' }}>
          Our Core Privacy Commitment
        </h2>
        <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          "Your health information is private and is only stored when you choose to provide it."
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.75', color: 'var(--text-secondary)' }}>
        <section>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            1. Zero Preloaded Records & Complete Isolation
          </h3>
          <p>
            HealthGPT begins with an <strong>empty database</strong> for every new user. We do not import, preload, or cross-reference third-party medical histories. Every piece of information in your health profile, medication schedule, or vital tracker exists solely because you explicitly opted to record it.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            2. Strict Administrative Access Firewall
          </h3>
          <p>
            Platform administrators have role-based visibility only over operational maintenance metrics (user count, account status, feedback tickets). <strong>Administrators do NOT have access to your private health profiles, medical notes, uploaded documents, or private AI conversations.</strong>
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            3. AI Service Privacy & Multi-Provider Abstraction
          </h3>
          <p>
            When utilizing our AI Health Assistant or Symptom Checker, queries are processed either through our built-in offline clinical knowledge triage engine or through secure, server-side API proxies. Secrets and credentials are encrypted on the backend and never exposed to client browsers.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            4. User Rights: Full Export & Instant Erasure
          </h3>
          <p>
            You retain 100% ownership of your health data:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Right to Export:</strong> Download all your records, vitals, reminders, and history as structured JSON at any moment via Settings.</li>
            <li><strong>Right to Erasure (Purge):</strong> Permanently delete your account with one click. This action performs an irreversible hard deletion across all database tables.</li>
          </ul>
        </section>

        <section>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            5. Contact Platform Data Officer
          </h3>
          <p>
            If you have security questions or wish to exercise administrative inquiries, submit a ticket through our in-app feedback channel or email <code>privacy@healthgpt.local</code>.
          </p>
        </section>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link to="/register" className="btn btn-primary">
          Accept & Create Account
        </Link>
      </div>
    </div>
  );
}
