import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2, X, MapPin, HeartPulse, Pill, Users } from 'lucide-react';

export function EmergencySosModal({ isOpen, onClose }) {
  const [stage, setStage] = useState('idle'); // 'idle' | 'holding' | 'dispatched'
  const [countdown, setCountdown] = useState(3);
  const [holdingProgress, setHoldingProgress] = useState(0);
  const [sosResult, setSosResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const holdIntervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStage('idle');
      setCountdown(3);
      setHoldingProgress(0);
      setSosResult(null);
      setError(null);
    }
  }, [isOpen]);

  const startHold = () => {
    if (stage !== 'idle') return;
    setHoldingProgress(0);
    const startTime = Date.now();
    const duration = 2500; // 2.5 seconds hold to prevent accidental trigger

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldingProgress(progress);

      if (elapsed >= duration) {
        clearInterval(holdIntervalRef.current);
        triggerSosDispatch();
      }
    }, 50);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (stage === 'idle') {
      setHoldingProgress(0);
    }
  };

  const triggerSosDispatch = async () => {
    setLoading(true);
    setStage('dispatched');
    setError(null);

    try {
      // Get device geolocation if permitted
      let coords = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          };
        } catch (e) {
          coords = { latitude: 13.0827, longitude: 80.2707, accuracy: 15 }; // Default fallback coordinates
        }
      }

      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/sos/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_coords: coords,
          include_clinical_snapshot: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SOS trigger failed');
      setSosResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '560px',
        width: '100%',
        boxShadow: 'var(--shadow-danger-glow)',
        border: '2px solid var(--danger-500)',
        overflow: 'hidden',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--danger-50)',
          borderBottom: '1px solid var(--danger-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-500)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger-600)', margin: 0 }}>
                Emergency SOS Dispatch
              </h2>
              <span className="badge badge-demo" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                DEMO MODE SIMULATION
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: '50%', padding: '0.4rem', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {stage === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Press and hold the SOS button below for <strong>2.5 seconds</strong> to activate simulated emergency dispatch.
                Dual emergency notifications will be routed with your clinical health snapshot.
              </p>

              {/* Dual Contact Targets Preview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.75rem',
                textAlign: 'left'
              }}>
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <PhoneCall size={16} style={{ color: 'var(--danger-500)' }} />
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Contact 1: Ambulance</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Emergency Dispatch: 108 / 911</div>
                </div>

                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <Users size={16} style={{ color: 'var(--accent-teal)' }} />
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Contact 2: Guardian</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Designated Care Contact</div>
                </div>
              </div>

              {/* Hold to Activate Button */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                <button
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger-500)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
                    transition: 'transform 0.15s, background-color 0.15s',
                    position: 'relative',
                    zIndex: 2,
                    userSelect: 'none'
                  }}
                >
                  HOLD<br />SOS
                </button>

                {/* Circular / linear Progress ring */}
                {holdingProgress > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    right: '-8px',
                    bottom: '-8px',
                    borderRadius: '50%',
                    border: `4px solid var(--danger-600)`,
                    opacity: holdingProgress / 100,
                    transform: `scale(${1 + holdingProgress / 500})`,
                    transition: 'all 0.05s linear'
                  }} />
                )}
              </div>

              {holdingProgress > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    height: '6px',
                    width: '200px',
                    margin: '0 auto',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${holdingProgress}%`,
                      backgroundColor: 'var(--danger-500)',
                      transition: 'width 0.05s linear'
                    }} />
                  </div>
                  <small style={{ color: 'var(--danger-600)', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                    Hold steady to dispatch...
                  </small>
                </div>
              )}

              {/* Direct Instant Click Trigger for accessibility */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={triggerSosDispatch}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}
                >
                  Or click here to test trigger immediately
                </button>
              </div>
            </div>
          )}

          {stage === 'dispatched' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                  <p>Dispatching simulated dual emergency alerts & compiling clinical snapshot...</p>
                </div>
              ) : error ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--danger-50)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-600)'
                }}>
                  {error}
                </div>
              ) : sosResult && (
                <div>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--accent-emerald-subtle)',
                    border: '1px solid var(--accent-emerald)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem'
                  }}>
                    <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      DEMO SOS Dispatched: Both simulated contact channels notified!
                    </span>
                  </div>

                  {/* Dual Contacts Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-600)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <PhoneCall size={14} /> Contact 1: Ambulance
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-primary)' }}>
                        {sosResult.contact1?.phone || '108 / 911'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sosResult.contact1?.action}
                      </div>
                    </div>

                    <div style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <Users size={14} /> Contact 2: Guardian
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-primary)' }}>
                        {sosResult.contact2?.name} ({sosResult.contact2?.phone})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sosResult.contact2?.action}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Snapshot Included */}
                  {sosResult.clinicalSnapshot && (
                    <div style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      marginBottom: '1rem',
                      fontSize: '0.85rem'
                    }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                        <HeartPulse size={15} style={{ color: 'var(--primary-600)' }} />
                        Clinical Health Snapshot Attached to Dispatch:
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <div><strong>Blood Group:</strong> {sosResult.clinicalSnapshot.bloodGroup}</div>
                        <div><strong>Allergies:</strong> {sosResult.clinicalSnapshot.allergies}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Active Medications:</strong> {sosResult.clinicalSnapshot.activeMedications}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Location:</strong> {sosResult.clinicalSnapshot.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Required Explicit Legal & Demo Disclaimer */}
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--danger-50)',
                    border: '1px solid var(--danger-100)',
                    fontSize: '0.785rem',
                    color: 'var(--danger-600)',
                    lineHeight: 1.45
                  }}>
                    <strong>⚠️ SIMULATION NOTICE:</strong> {sosResult.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-muted)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          {stage === 'dispatched' ? (
            <button onClick={onClose} className="btn btn-primary btn-sm">
              Done / Close
            </button>
          ) : (
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
