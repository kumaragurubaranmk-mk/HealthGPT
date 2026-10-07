import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';

export function SymptomCheckerPage() {
  const { token, isDemoMode } = useAuth();
  const { language } = useLanguage();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    symptoms: '',
    duration: '1-3 days',
    severity: 'mild',
    bodyRegion: 'Head / Neck',
    aggravatingFactors: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!formData.symptoms.trim()) return;

    setLoading(true);

    const fullQuery = `Symptom Assessment: ${formData.symptoms}. Duration: ${formData.duration}. Severity: ${formData.severity}. Body Region: ${formData.bodyRegion}. Known Triggers: ${formData.aggravatingFactors}`;

    try {
      if (isDemoMode) {
        // Instant synthetic analysis
        setTimeout(() => {
          setResult({
            summary: "Educational evaluation of mild headache and screen fatigue symptoms.",
            possibleExplanations: [
              "Tension-Type Headache: Muscle contractions in neck and scalp provoked by prolonged screen time.",
              "Subclinical Dehydration or Eye Fatigue: Prolonged near-point convergence without adequate blinking."
            ],
            whatUserCanDo: [
              "Practice the 20-20-20 rule: Every 20 minutes, look at an object 20 feet away for 20 seconds.",
              "Drink 500ml of water and rest in a softly lit environment.",
              "Perform gentle suboccipital and shoulder stretching."
            ],
            whenToSeekHelp: [
              "Sudden 'thunderclap' headache or severe visual aura.",
              "Fever with neck stiffness or progressive weakness."
            ],
            disclaimer: "Non-diagnostic triage prototype. Always consult a physician for individual health care."
          });
          setIsEmergency(false);
          setLoading(false);
          setStep(4);
        }, 600);
        return;
      }

      // Live backend AI analysis
      // First create or use symptom checker conversation
      const convRes = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: `Triage: ${formData.symptoms.slice(0, 30)}`,
          language,
          module_type: 'symptom_checker'
        })
      });
      const convData = await convRes.json();

      const msgRes = await fetch(`/api/ai/conversations/${convData.conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: fullQuery,
          language
        })
      });
      const msgData = await msgRes.json();

      if (msgData.assistantMessage?.is_emergency) {
        setIsEmergency(true);
      } else {
        setIsEmergency(false);
      }

      setResult(msgData.assistantMessage?.structured_data || {
        summary: "Assessment complete.",
        possibleExplanations: ["General discomfort requiring clinical review."],
        whatUserCanDo: ["Rest comfortably and monitor changes."],
        whenToSeekHelp: ["If symptoms intensify or new red flags develop."],
        disclaimer: "Educational triage only."
      });
      setStep(4);
    } catch (err) {
      console.error('Triage assessment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    setIsEmergency(false);
    setFormData({
      symptoms: '',
      duration: '1-3 days',
      severity: 'mild',
      bodyRegion: 'Head / Neck',
      aggravatingFactors: ''
    });
  };

  return (
    <div className="dashboard-body" style={{ maxWidth: '900px' }}>
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
          margin: '0 auto 1rem'
        }}>
          <Stethoscope size={28} />
        </div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Educational Symptom Checker</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Describe your symptoms to receive structured possibilities, supportive next steps, and guidance on when to seek in-person medical attention.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* Step Tracker */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        margin: '2rem 0',
        padding: '1rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {[
          { num: 1, title: 'Description' },
          { num: 2, title: 'Severity & Area' },
          { num: 3, title: 'Context & Triggers' },
          { num: 4, title: 'Assessment' }
        ].map(s => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: step >= s.num ? 'var(--primary-600)' : 'var(--bg-muted)',
              color: step >= s.num ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}>
              {s.num}
            </div>
            <span style={{
              fontWeight: step === s.num ? '700' : '500',
              color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.875rem'
            }}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Primary Symptoms */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Step 1: Describe What You Are Experiencing</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            In simple language, what symptoms are bothering you? (e.g. "Dull headache behind eyes after work, mild sensitivity to sunlight")
          </p>

          <div className="form-group">
            <textarea
              rows="4"
              className="form-control"
              placeholder="Describe what you feel, when it started, and where..."
              value={formData.symptoms}
              onChange={(e) => handleInputChange('symptoms', e.target.value)}
              style={{ fontSize: '1rem', lineHeight: '1.6' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.symptoms.trim()}
              className="btn btn-primary"
            >
              Next: Severity & Area <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Severity, Duration, Body Region */}
      {step === 2 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Step 2: Duration, Intensity & Location</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Help us refine the clinical category.
          </p>

          <div className="form-row" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <select
                className="form-control"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              >
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1-3 days">1 to 3 days</option>
                <option value="4-7 days">4 to 7 days</option>
                <option value="1-2 weeks">1 to 2 weeks</option>
                <option value="More than 2 weeks">More than 2 weeks (Chronic)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <select
                className="form-control"
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
              >
                <option value="mild">Mild (Noticeable but does not disrupt tasks)</option>
                <option value="moderate">Moderate (Interferes with routine work)</option>
                <option value="severe">Severe (Debilitating pain or distress)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Body Region</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {['Head / Neck', 'Chest / Lungs', 'Abdomen / Gut', 'Arms / Legs', 'Skin / Rash', 'Whole Body / Fatigue'].map(region => (
                <button
                  type="button"
                  key={region}
                  onClick={() => handleInputChange('bodyRegion', region)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: formData.bodyRegion === region ? '2px solid var(--primary-500)' : '1px solid var(--border-medium)',
                    backgroundColor: formData.bodyRegion === region ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: formData.bodyRegion === region ? 'var(--primary-700)' : 'var(--text-primary)',
                    fontWeight: formData.bodyRegion === region ? '700' : '500',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Next: Context & Triggers <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Triggers & Context */}
      {step === 3 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Step 3: Relevant Context & Triggers</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Are there any specific activities, meals, or stressors that make the symptoms better or worse?
          </p>

          <div className="form-group">
            <label className="form-label">Known Triggers or Observations (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Gets worse looking at bright lights, eased by resting in darkness"
              value={formData.aggravatingFactors}
              onChange={(e) => handleInputChange('aggravatingFactors', e.target.value)}
            />
          </div>

          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            ℹ️ HealthGPT uses non-diagnostic reasoning to summarize possible explanations. It will NEVER make a definitive clinical diagnosis.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              Back
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? 'Analyzing Clinical Patterns...' : 'Run Triage Analysis'} <Sparkles size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Triage Results */}
      {step === 4 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isEmergency && (
            <EmergencyBanner
              message="POTENTIAL MEDICAL EMERGENCY DETECTED: Symptoms reported may require urgent clinical triage."
            />
          )}

          <div className="card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-primary">Educational Triage Report</span>
              <button onClick={handleReset} className="btn btn-ghost btn-sm">
                <RotateCcw size={16} /> New Assessment
              </button>
            </div>

            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-700)', marginBottom: '0.5rem' }}>
              {result.summary}
            </h2>

            {/* Possible Causes */}
            <div style={{ margin: '1.5rem 0' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                Potentially Relevant Possibilities (Non-Diagnostic)
              </h3>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {result.possibleExplanations?.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Supportive Next Steps */}
            <div style={{
              margin: '1.5rem 0',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)'
            }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--accent-teal)' }}>
                💡 General Supportive Steps & Self-Care
              </h3>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {result.whatUserCanDo?.map((stepItem, idx) => (
                  <li key={idx} style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {stepItem}
                  </li>
                ))}
              </ul>
            </div>

            {/* When to Seek Help */}
            <div style={{ margin: '1.5rem 0' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={18} />
                When to Seek Professional Medical Care
              </h3>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {result.whenToSeekHelp?.map((warnItem, idx) => (
                  <li key={idx} style={{ fontSize: '0.95rem', color: 'var(--danger-600)' }}>
                    {warnItem}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              fontStyle: 'italic'
            }}>
              {result.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
