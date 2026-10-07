import React, { useState } from 'react';
import {
  Bell,
  Pill,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Video,
  X,
  Sparkles
} from 'lucide-react';

export function MedicineReminderModal({
  isOpen,
  onClose,
  reminder,
  onTakeNow,
  onStartCareConnect,
  onRemindLater
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !reminder) return null;

  const medicineName = reminder.medicine_name || reminder.name || 'Prescription Medicine';
  const dosage = reminder.dosage || '500 mg';
  const time = reminder.reminder_time || reminder.time || '08:00 AM';
  const instructions = reminder.instructions || 'Take with water after food';

  const handleTakeNowClick = async () => {
    setSubmitting(true);
    try {
      if (onTakeNow) {
        await onTakeNow(reminder);
      }
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setSubmitting(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const handleRemindLaterClick = () => {
    if (onRemindLater) {
      onRemindLater(reminder);
    }
    onClose();
  };

  const handleCareConnectClick = () => {
    onClose();
    if (onStartCareConnect) {
      onStartCareConnect(reminder);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
          border: '1.5px solid #e0f2fe',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Header with gentle pulsing alarm theme */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Medicine Reminder
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                Scheduled dose is due right now
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              opacity: 0.8,
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Medication Card Details */}
        <div style={{ padding: '1.5rem' }}>
          {confirmed ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: '#10b981'
              }}
            >
              <CheckCircle2 size={54} style={{ margin: '0 auto 1rem', color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                Medication Marked as Taken!
              </h3>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Adherence score and medical timeline updated.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '0.75rem',
                    backgroundColor: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <Pill size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    Prescription Item
                  </span>
                  <h4 style={{ margin: '0.1rem 0 0.2rem', fontSize: '1.35rem', color: '#0f172a' }}>
                    {medicineName}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #0284c7',
                        color: '#0284c7',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.35rem'
                      }}
                    >
                      {dosage}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#475569',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <Clock size={14} /> Scheduled: {time}
                    </span>
                  </div>
                </div>
              </div>

              {instructions && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.65rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={16} color="#0284c7" />
                  <span><strong>Instructions:</strong> {instructions}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* 1. Primary TAKE NOW button */}
                <button
                  id="btn-take-now"
                  onClick={handleTakeNowClick}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '0.85rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={20} />
                  {submitting ? 'RECORDING INTAKE...' : 'TAKE NOW'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* 2. CareConnect Video Option */}
                  <button
                    id="btn-careconnect-checkin"
                    onClick={handleCareConnectClick}
                    style={{
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      border: '1.5px solid #0284c7',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                    title="Launch supervised video call with caregiver"
                  >
                    <Video size={16} /> CareConnect Video
                  </button>

                  {/* 3. REMIND ME LATER button */}
                  <button
                    id="btn-remind-later"
                    onClick={handleRemindLaterClick}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Clock size={16} /> Remind Me Later
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
