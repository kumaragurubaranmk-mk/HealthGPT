import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, PhoneCall, Volume2, Video, AlertCircle, Sparkles } from 'lucide-react';

export function DemoCallModal({ isOpen, onClose, reminder, onProceedToVideo }) {
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [callSeconds, setCallSeconds] = useState(0);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const ringtoneAudioRef = useRef(null);
  const timerRef = useRef(null);

  const medicineName = reminder?.medicine_name || 'Prescription Medication';
  const dosage = reminder?.dosage || '1 dose';
  const reminderTime = reminder?.reminder_time || '08:00 AM';

  // Ringtone synthesizer using Web Audio API
  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setCallSeconds(0);
      setAudioPlayed(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }

    // Play ringing tone pattern if in ringing state
    let audioCtx = null;
    let ringInterval = null;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();

        const playChime = () => {
          if (callState !== 'ringing') return;
          try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          } catch (e) {
            // Audio context may be restricted by autoplay policy
          }
        };

        playChime();
        ringInterval = setInterval(playChime, 2500);
      }
    } catch (e) {
      // Audio fallback
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    };
  }, [isOpen, callState]);

  // Answer call
  const handleAnswer = () => {
    setCallState('connected');
    timerRef.current = setInterval(() => {
      setCallSeconds(s => s + 1);
    }, 1000);

    // Speak medicine reminder via SpeechSynthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `Hello. This is your HealthGPT automated medicine call reminder. It is now time for your scheduled dose of ${medicineName}, dosage ${dosage}. Please take your medicine with water and proceed to the video verification session on your screen to confirm adherence. Thank you.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      setAudioPlayed(true);
    }
  };

  // Decline / hang up
  const handleEndCall = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleProceed = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
    if (onProceedToVideo) {
      onProceedToVideo(reminder);
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
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '32px',
        border: '3px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Phone Top Notch */}
        <div style={{
          padding: '1rem 1.5rem 0.5rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '120px',
            height: '18px',
            backgroundColor: '#1e293b',
            borderRadius: '9px'
          }} />
        </div>

        {/* Demo Mode Badge */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            fontSize: '0.725rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <Sparkles size={12} /> DEMO CALL SIMULATION
          </span>
        </div>

        {/* Caller Info */}
        <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem 1rem' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-600)',
            margin: '0 auto 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: callState === 'ringing' ? '0 0 0 12px rgba(2, 132, 199, 0.25)' : 'none',
            animation: callState === 'ringing' ? 'pulseRing 2s infinite' : 'none'
          }}>
            <PhoneCall size={40} color="#fff" />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#f8fafc' }}>
            HealthGPT Clinical Dispatch
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            {callState === 'ringing' ? 'Incoming Medicine Call...' : `Call Connected • 00:${callSeconds < 10 ? '0' : ''}${callSeconds}`}
          </p>

          {/* Reminder Card Details */}
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Scheduled Dose: {reminderTime}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              {medicineName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
              Dosage: <strong>{dosage}</strong>
            </div>
          </div>

          {/* Spoken Audio Script Display */}
          {callState === 'connected' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              fontSize: '0.8rem',
              color: '#bae6fd',
              lineHeight: 1.45,
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '4px' }}>
                <Volume2 size={14} /> Voice Announcement:
              </div>
              "It is time to take your scheduled dose of {medicineName} ({dosage}). Please proceed to video verification to confirm."
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div style={{
          padding: '1.5rem 2rem 2.25rem',
          display: 'flex',
          justifyContent: callState === 'ringing' ? 'space-around' : 'center',
          gap: '1rem'
        }}>
          {callState === 'ringing' ? (
            <>
              {/* Decline button */}
              <button
                onClick={handleEndCall}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}
                title="Decline"
              >
                <PhoneOff size={28} />
              </button>

              {/* Accept button */}
              <button
                onClick={handleAnswer}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
                title="Answer Call"
              >
                <Phone size={28} />
              </button>
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleProceed}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '14px',
                  backgroundColor: 'var(--primary-600)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                <Video size={18} /> Proceed to Video Verification
              </button>

              <button
                onClick={handleEndCall}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '14px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                End Call
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer Footer */}
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#090d16',
          borderTop: '1px solid #1e293b',
          fontSize: '0.7rem',
          color: '#64748b',
          textAlign: 'center',
          lineHeight: 1.3
        }}>
          Simulated incoming voice call reminder. In production with active Twilio/SIP trunk credentials, an actual telephone ring will occur on your mobile device.
        </div>
      </div>
    </div>
  );
}
