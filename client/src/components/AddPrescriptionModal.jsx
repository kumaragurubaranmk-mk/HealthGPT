import React, { useState } from 'react';
import { Upload, Camera, FileText, CheckCircle2, AlertCircle, Plus, Trash2, Edit2, ArrowRight, ShieldCheck, Sparkles, X, Clock } from 'lucide-react';

export function AddPrescriptionModal({ isOpen, onClose, onPrescriptionSaved }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'verify'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('Doctor Prescription');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [medicines, setMedicines] = useState([]);

  if (!isOpen) return null;

  const handleLoadSample = async (sampleType = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/prescriptions/samples', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const sample = data.samples?.[sampleType - 1] || data.samples?.[0];

      if (sample) {
        setTitle(sample.title);
        setDoctorName(sample.doctorName);
        setPrescriptionDate(sample.date);
        setRawText(sample.rawText);
        setFileName(`${sample.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);

        // Automatically run OCR/AI extraction
        await runExtraction(sample.rawText, sample.doctorName, sample.date);
      }
    } catch (err) {
      alert(`Could not load sample: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type || 'application/pdf');
      if (!title || title === 'Doctor Prescription') {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }

      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRawText(event.target.result || '');
        };
        reader.readAsText(file);
      } else {
        if (!rawText) {
          setRawText(`Prescription Document: ${file.name}. Scanned medical prescription for pharmacy dispensing.`);
        }
      }
    }
  };

  const runExtraction = async (textToExtract = rawText, doc = doctorName, pDate = prescriptionDate) => {
    if (!textToExtract || !textToExtract.trim()) {
      alert('Please upload a prescription or provide notes/text for OCR extraction.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/prescriptions/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          raw_text: textToExtract,
          doctor_name: doc,
          prescription_date: pDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      setDoctorName(data.doctorName || doc || 'Dr. Sarah Mitchell, MD');
      setPrescriptionDate(data.prescriptionDate || pDate);
      setMedicines(data.extractedMedicines || []);
      setStep('verify');
    } catch (err) {
      alert(`Extraction error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMedicine = (index, field, value) => {
    const updated = [...medicines];
    if (field === 'intakeTimes') {
      updated[index][field] = value.split(',').map(s => s.trim());
    } else {
      updated[index][field] = value;
    }
    setMedicines(updated);
  };

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: 'New Medicine',
        dosage: '500 mg',
        frequency: 'Twice daily',
        intakeTimes: ['08:00 AM', '08:00 PM'],
        duration: '7 days',
        instructions: 'Take after meals with water.',
        confidence: 1.0,
        needsVerification: false
      }
    ]);
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleConfirmAndSave = async () => {
    if (medicines.length === 0) {
      alert('Please include at least one verified medicine.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          doctor_name: doctorName,
          prescription_date: prescriptionDate,
          file_name: fileName || 'prescription.pdf',
          file_type: fileType,
          raw_ocr_text: rawText,
          verified_medicines: medicines
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save prescription');

      if (onPrescriptionSaved) {
        onPrescriptionSaved(data);
      }
      onClose();
    } catch (err) {
      alert(`Error saving prescription: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

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
      <div style={{
        maxWidth: '740px',
        width: '100%',
        maxHeight: '92vh',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-medium)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-muted)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {step === 'upload' ? 'Upload & Extract Prescription' : 'Verify & Confirm Extracted Medicines'}
              </h2>
              <span className="badge badge-primary">
                {step === 'upload' ? 'Step 1: OCR + AI' : 'Step 2: Verification'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {step === 'upload' ? 'Upload image, scan, or PDF prescription for intelligent medicine extraction' : 'Review AI-extracted medications before automatically generating schedules'}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {step === 'upload' ? (
            <div>
              {/* Quick Sample Loader for Hackathon Judges */}
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--primary-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={15} /> 1-Click Hackathon Presets:
                  </strong>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    Test instant OCR & AI extraction with pre-formatted clinical prescriptions.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(1)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Sample 1: Antibiotics (Amoxicillin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(2)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Sample 2: Chronic (Metformin + Statin)
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-muted)',
                marginBottom: '1.25rem',
                cursor: 'pointer'
              }}>
                <input
                  type="file"
                  id="prescription-file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="prescription-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={36} style={{ color: 'var(--primary-600)', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {fileName ? `File Selected: ${fileName}` : 'Upload Prescription (Camera / Image / PDF)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Supports JPG, PNG, PDF document scans or text prescriptions
                  </div>
                </label>
              </div>

              {/* Prescription Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Prescription Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Post-Consultation Prescription"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Prescription Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Doctor / Clinic (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Mitchell, MD"
                />
              </div>

              {/* Raw Text / Notes Area for OCR */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Prescription Text / OCR Content
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste or type prescription lines (e.g. Amoxicillin 500mg Twice daily - 7 days)..."
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => runExtraction()}
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {loading ? 'Running OCR & AI...' : 'Run OCR & Extract Medicines'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Verification Safety Banner */}
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--accent-amber-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-amber)',
                marginBottom: '1.25rem',
                fontSize: '0.825rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                <span>
                  <strong>User Verification Required:</strong> AI extracted the medicines below. Do not automatically trust OCR results—review and correct any details before saving.
                </span>
              </div>

              {/* Doctor & Date Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prescribing Doctor:</span>
                  <input
                    type="text"
                    className="form-input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    style={{ fontSize: '0.85rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    style={{ fontSize: '0.85rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              {/* Medicines Verification List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Extracted Medications ({medicines.length}):
                </h4>
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={13} /> Add Medicine
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {medicines.map((med, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '0.85rem' }}>
                          #{idx + 1}
                        </span>
                        {med.needsVerification && (
                          <span className="badge badge-demo" style={{ backgroundColor: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)', fontSize: '0.7rem' }}>
                            Needs Verification
                          </span>
                        )}
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          AI Confidence: {Math.round((med.confidence || 0.9) * 100)}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-500)', padding: '0.2rem' }}
                        title="Remove medicine"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medicine Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={med.medicineName || med.name}
                          onChange={(e) => handleUpdateMedicine(idx, 'medicineName', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dosage</label>
                        <input
                          type="text"
                          className="form-input"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                          placeholder="e.g. 500 mg"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frequency</label>
                        <select
                          className="form-input"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Intake Schedule Times (comma separated)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={Array.isArray(med.intakeTimes) ? med.intakeTimes.join(', ') : med.intakeTimes || '08:00 AM'}
                          onChange={(e) => handleUpdateMedicine(idx, 'intakeTimes', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                          placeholder="08:00 AM, 08:00 PM"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration</label>
                        <input
                          type="text"
                          className="form-input"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                          placeholder="e.g. 7 days"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Intake Instructions</label>
                      <input
                        type="text"
                        className="form-input"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                        placeholder="e.g. Take after meals with plenty of water"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="btn btn-secondary btn-sm"
                >
                  Back to OCR Upload
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    disabled={submitting || medicines.length === 0}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={16} />
                    {submitting ? 'Generating Schedules...' : 'Confirm & Generate Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
