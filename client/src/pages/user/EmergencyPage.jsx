import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  HeartPulse,
  Activity,
  ShieldAlert,
  User,
  Clock,
  Play,
  Square
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function EmergencyPage() {
  const { isDemoMode, demoData } = useAuth();
  const [cprActive, setCprActive] = useState(false);

  return (
    <div className="dashboard-body" style={{ maxWidth: '980px' }}>
      {/* Top Urgent Alert Header */}
      <div style={{
        backgroundColor: 'var(--danger-500)',
        color: 'white',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-danger-glow)',
        marginBottom: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'white',
          color: 'var(--danger-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <AlertTriangle size={32} />
        </div>
        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          EMERGENCY MEDICAL SOS
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.95, maxWidth: '650px', margin: '0 auto 1.75rem' }}>
          If someone is unconscious, unable to breathe, having severe chest pain, or exhibiting stroke signs, summon professional emergency paramedics immediately.
        </p>

        {/* Big Click-to-call Hotlines */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          <a
            href="tel:108"
            className="btn btn-lg"
            style={{ backgroundColor: 'white', color: 'var(--danger-600)', fontWeight: '800', fontSize: '1.2rem', padding: '0.85rem 2rem' }}
          >
            <PhoneCall size={22} /> Call 108 (India Ambulance)
          </a>
          <a
            href="tel:112"
            className="btn btn-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', fontWeight: '800', fontSize: '1.2rem', padding: '0.85rem 2rem' }}
          >
            <PhoneCall size={22} /> Call 112 (National Emergency)
          </a>
          <a
            href="tel:911"
            className="btn btn-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: 'white', fontWeight: '700', fontSize: '1.1rem' }}
          >
            <PhoneCall size={20} /> Call 911 (US)
          </a>
        </div>
      </div>

      {/* Emergency Contact Speed Dial */}
      <div className="card" style={{ marginBottom: '2rem', border: '1.5px solid var(--accent-teal)' }}>
        <h3 className="card-title" style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
          <User size={20} /> Your Designated Emergency Contact
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Configured in your Health Profile for crisis notifications.
        </p>

        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
              {isDemoMode ? demoData.healthProfile.emergency_contact_name : 'Primary Emergency Contact'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Relation: {isDemoMode ? demoData.healthProfile.emergency_contact_relation : 'Family / Guardian'}
            </div>
          </div>

          <a
            href={isDemoMode ? `tel:${demoData.healthProfile.emergency_contact_phone}` : '#'}
            className="btn btn-primary"
          >
            <PhoneCall size={18} /> Speed Dial: {isDemoMode ? demoData.healthProfile.emergency_contact_phone : '+1 (555) 019-2835'}
          </a>
        </div>
      </div>

      {/* Stroke Recognition FAST protocol */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ color: 'var(--danger-600)', marginBottom: '0.5rem' }}>
          🧠 Stroke Warning: The F.A.S.T. Assessment
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Time is brain tissue. Check these four signs immediately:
        </p>

        <div className="grid-4">
          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger-600)', marginBottom: '0.25rem' }}>F</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Face Drooping</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Does one side of their face droop when smiling?</p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger-600)', marginBottom: '0.25rem' }}>A</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Arm Weakness</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Does one arm drift downwards when both are raised?</p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger-600)', marginBottom: '0.25rem' }}>S</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Speech Difficulty</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Is speech slurred or difficult to comprehend?</p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger-600)', marginBottom: '0.25rem' }}>T</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Time to Call</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Call 108/112/911 immediately if you observe any sign.</p>
          </div>
        </div>
      </div>

      {/* Hands-Only CPR Protocol */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title"><HeartPulse size={22} style={{ color: 'var(--danger-500)' }} /> Hands-Only CPR Instructions</h3>
            <p className="card-subtitle">For unconscious adult victims who are not breathing normally</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>
              1
            </div>
            <div>
              <strong>Call Emergency Services Immediately:</strong> Dial 108 or 112 and put phone on speaker so dispatchers can instruct you.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>
              2
            </div>
            <div>
              <strong>Position Your Hands:</strong> Place heel of one hand in center of the chest. Interlock fingers of second hand on top. Keep elbows locked straight.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>
              3
            </div>
            <div>
              <strong>Push Hard & Fast:</strong> Compress chest at 100 to 120 beats per minute (to the beat of the song "Stayin' Alive"). Compress 2 inches (5 cm) deep and allow complete chest recoil between pumps.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
