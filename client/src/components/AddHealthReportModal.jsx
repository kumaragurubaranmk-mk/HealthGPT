import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, ArrowRight, ShieldCheck, Sparkles, X, HeartPulse, Activity } from 'lucide-react';

export function AddHealthReportModal({ isOpen, onClose, onReportSaved }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'verify'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('Laboratory & Clinical Report');
  const [reportType, setReportType] = useState('lab_test');
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileData, setFileData] = useState('');
  const [biomarkers, setBiomarkers] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  if (!isOpen) return null;

  const handleLoadSample = async (sampleIndex = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/reports/samples', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const sample = data.samples?.[sampleIndex] || data.samples?.[0];

      if (sample) {
        setTitle(sample.title);
        setReportType(sample.reportType || 'lab_test');
        setDoctorName(sample.doctorName);
        setFacilityName(sample.facilityName);
        setReportDate(sample.reportDate);
        setRawText(sample.rawText);
        setFileName(`${sample.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);

        // Run OCR/AI extraction
        await runExtraction(sample.rawText, sample.title, sample.doctorName, sample.facilityName, sample.reportDate);
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
      if (!title || title === 'Laboratory & Clinical Report') {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }

      // Read as Data URL to store and preview the real PDF or image
      const dataUrlReader = new FileReader();
      dataUrlReader.onload = (event) => {
        setFileData(event.target.result || '');
      };
      dataUrlReader.readAsDataURL(file);

      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const textReader = new FileReader();
        textReader.onload = (event) => {
          setRawText(event.target.result || '');
        };
        textReader.readAsText(file);
      } else {
        if (!rawText) {
          setRawText(`Diagnostic Report: ${file.name}. Complete pathology & physiological measurements.`);
        }
      }
    }
  };

  const runExtraction = async (textToExtract = rawText, reportTitle = title, doc = doctorName, fac = facilityName, rDate = reportDate) => {
    if (!textToExtract || !textToExtract.trim()) {
      alert('Please upload a file or paste lab report findings to extract values.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/reports/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          raw_text: textToExtract,
          title: reportTitle,
          report_type: reportType,
          doctor_name: doc,
          facility_name: fac,
          report_date: rDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Report extraction failed');

      setDoctorName(data.doctorName || doc);
      setFacilityName(data.facilityName || fac);
      setReportDate(data.reportDate || rDate);
      setBiomarkers(data.extractedBiomarkers || []);
      setAiSummary(data.aiSummary || '');
      setStep('verify');
    } catch (err) {
      alert(`Extraction error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBiomarker = (index, field, value) => {
    const updated = [...biomarkers];
    if (field === 'value') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setBiomarkers(updated);
  };

  const handleAddBiomarkerRow = () => {
    setBiomarkers([
      ...biomarkers,
      {
        name: 'Blood Glucose',
        key: 'glucose',
        value: 95,
        unit: 'mg/dL',
        referenceRange: '70 - 99 mg/dL',
        category: 'glycemic',
        status: 'normal'
      }
    ]);
  };

  const handleRemoveBiomarkerRow = (index) => {
    setBiomarkers(biomarkers.filter((_, i) => i !== index));
  };

  const handleConfirmAndSave = async () => {
    if (biomarkers.length === 0) {
      alert('Please include at least one verified biomarker or vital reading.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          report_type: reportType,
          report_date: reportDate,
          doctor_name: doctorName,
          facility_name: facilityName,
          file_name: fileName || 'lab_report.pdf',
          file_type: fileType,
          file_data: fileData,
          raw_text: rawText,
          verified_biomarkers: biomarkers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save medical report');

      if (onReportSaved) {
        onReportSaved(data);
      }
      onClose();
    } catch (err) {
      alert(`Error saving report: ${err.message}`);
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
        maxWidth: '760px',
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
                {step === 'upload' ? 'Upload & Extract Health Report' : 'Verify & Confirm Health Data'}
              </h2>
              <span className="badge badge-primary">
                {step === 'upload' ? 'Step 1: OCR + AI' : 'Step 2: Verification'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {step === 'upload' ? 'Blood tests, metabolic panels, cardiology scans, or vitals sheets' : 'Verify extracted vitals and laboratory results before populating Health Tracker'}
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
              {/* 1-Click Hackathon Presets */}
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
                    <Sparkles size={15} /> 1-Click Hackathon Report Presets:
                  </strong>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    Instantly load and test real clinical blood panels with vitals and reference ranges.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(0)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Preset 1: CBC & Vitals (Normal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(1)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Preset 2: Glycemic & Lipids
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
                  id="report-file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="report-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={36} style={{ color: 'var(--primary-600)', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {fileName ? `File Selected: ${fileName}` : 'Choose Medical Report (Image / Scan / PDF)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Detects Blood Pressure, Heart Rate, SpO2, Blood Glucose, Hemoglobin, Cholesterol, Weight, Temp
                  </div>
                </label>
              </div>

              {/* Report Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Report Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete Blood Count & Metabolic Panel"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                  <select
                    className="form-input"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="lab_test">Blood / Lab Test</option>
                    <option value="scan_imaging">Scan / Imaging (X-Ray / MRI)</option>
                    <option value="cardiology">Cardiology / ECG</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="other">General Medical Report</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Report Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Physician</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Michael Sanders"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Laboratory / Hospital</label>
                  <input
                    type="text"
                    className="form-input"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="Apex Diagnostic Lab"
                  />
                </div>
              </div>

              {/* Raw Text / Findings Box */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Raw Findings / Text for OCR & AI Extraction
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste or type lab values (e.g. Blood Pressure: 124/80, Hemoglobin: 14.2 g/dL, Glucose: 95 mg/dL)..."
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
                  {loading ? 'Running OCR & AI...' : 'Run OCR & Extract Health Data'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Verification Safety Banner */}
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--primary-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)',
                marginBottom: '1.25rem',
                fontSize: '0.825rem',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                <span>
                  <strong>User Verification Required:</strong> Review AI-extracted indicators below. Correct any values before confirmation. These will automatically populate your Health Tracker and Lifetime Trends.
                </span>
              </div>

              {/* AI Layperson Summary Preview */}
              {aiSummary && (
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>AI Layperson Summary: </strong>
                  {aiSummary}
                </div>
              )}

              {/* Extracted Biomarkers & Vitals Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Extracted Indicators ({biomarkers.length}):
                </h4>
                <button
                  type="button"
                  onClick={handleAddBiomarkerRow}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={13} /> Add Biomarker
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {biomarkers.map((bio, idx) => (
                  <div key={idx} style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Health Indicator</label>
                        <input
                          type="text"
                          className="form-input"
                          value={bio.name}
                          onChange={(e) => handleUpdateBiomarker(idx, 'name', e.target.value)}
                          style={{ fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Value</label>
                        <input
                          type="number"
                          step="any"
                          className="form-input"
                          value={bio.value}
                          onChange={(e) => handleUpdateBiomarker(idx, 'value', e.target.value)}
                          style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unit</label>
                        <input
                          type="text"
                          className="form-input"
                          value={bio.unit}
                          onChange={(e) => handleUpdateBiomarker(idx, 'unit', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reference Range</label>
                        <input
                          type="text"
                          className="form-input"
                          value={bio.referenceRange || ''}
                          onChange={(e) => handleUpdateBiomarker(idx, 'referenceRange', e.target.value)}
                          style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                          placeholder="e.g. 70 - 99"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBiomarkerRow(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-500)', padding: '0.2rem', marginTop: '14px' }}
                        title="Remove row"
                      >
                        <Trash2 size={16} />
                      </button>
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
                  Back to Upload
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    disabled={submitting || biomarkers.length === 0}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={16} />
                    {submitting ? 'Updating Health Profile...' : 'Confirm & Populate Health Tracker'}
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
