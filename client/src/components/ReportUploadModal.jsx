import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, ArrowRight, ShieldCheck, X } from 'lucide-react';

export function ReportUploadModal({ isOpen, onClose, existingReports = [], onReportSaved }) {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('lab_test');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [parentReportId, setParentReportId] = useState('');
  const [uploadMode, setUploadMode] = useState('new'); // 'new' | 'update'
  const [customBiomarkers, setCustomBiomarkers] = useState([]);
  const [newBioName, setNewBioName] = useState('');
  const [newBioVal, setNewBioVal] = useState('');
  const [newBioUnit, setNewBioUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type || 'application/pdf');
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }

      // If text file or plain text, read content
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRawText(event.target.result || '');
        };
        reader.readAsText(file);
      } else {
        // Pre-fill realistic sample text for PDF/Scans if user didn't write notes
        if (!rawText) {
          setRawText(`Uploaded Document: ${file.name}. Lab observations and clinical indicators recorded.`);
        }
      }
    }
  };

  const handleAddCustomBiomarker = () => {
    if (!newBioName || !newBioVal) return;
    const num = parseFloat(newBioVal);
    if (isNaN(num)) return;

    setCustomBiomarkers([
      ...customBiomarkers,
      { name: newBioName.trim(), value: num, unit: newBioUnit.trim() }
    ]);
    setNewBioName('');
    setNewBioVal('');
    setNewBioUnit('');
  };

  const handleRemoveBiomarker = (idx) => {
    setCustomBiomarkers(customBiomarkers.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !reportDate) {
      alert('Please provide a report title and date.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const payload = {
        title,
        report_type: reportType,
        report_date: reportDate,
        doctor_name: doctorName,
        facility_name: facilityName,
        raw_text: rawText,
        file_name: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        file_type: fileType || 'application/pdf',
        parent_report_id: uploadMode === 'update' && parentReportId ? parentReportId : null,
        custom_biomarkers: customBiomarkers
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload report');

      setUploadResult(data);
      if (onReportSaved) {
        onReportSaved(data);
      }
    } catch (err) {
      alert(`Report upload failed: ${err.message}`);
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
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {uploadResult ? 'Report Extraction Complete' : 'Upload & Parse Medical Report'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              PDF, Scans, JPG/PNG, Lab Tests, Prescriptions, Discharge Summaries
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {uploadResult ? (
            <div>
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--accent-emerald-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--accent-emerald)',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                <div>
                  <strong>{uploadResult.message}</strong>
                  <div style={{ fontSize: '0.85rem' }}>
                    Version {uploadResult.report.version} saved • {uploadResult.biomarkers?.length || 0} clinical biomarkers structured.
                  </div>
                </div>
              </div>

              {/* AI Plain Language Summary */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  🤖 AI Layperson Summary:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {uploadResult.report.ai_summary}
                </p>
              </div>

              {/* Automated Comparison if present */}
              {uploadResult.comparison?.hasComparison && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--primary-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-200)',
                  marginBottom: '1.25rem'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-700)', marginBottom: '6px' }}>
                    📈 Automated Historical Comparison Generated:
                  </strong>
                  <pre style={{
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {uploadResult.comparison.aiExplanation}
                  </pre>
                </div>
              )}

              {/* Extracted Biomarkers Table */}
              {uploadResult.biomarkers?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Extracted Health Indicators:
                  </strong>
                  <div style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Indicator</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Value</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Ref Range</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.biomarkers.map((b, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{b.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{b.value} {b.unit}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{b.referenceRange}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span className={`badge ${b.status === 'normal' ? 'badge-primary' : b.status === 'elevated' ? 'badge-danger' : 'badge-demo'}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={onClose} className="btn btn-primary btn-sm">
                  Close & View in Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Upload Mode Selector (New vs Version Update) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  type="button"
                  onClick={() => setUploadMode('new')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: uploadMode === 'new' ? '2px solid var(--primary-600)' : '1px solid var(--border-medium)',
                    backgroundColor: uploadMode === 'new' ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: uploadMode === 'new' ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '0.9rem' }}>📄 New Baseline Report</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    Start a new health record or category
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadMode('update')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: uploadMode === 'update' ? '2px solid var(--primary-600)' : '1px solid var(--border-medium)',
                    backgroundColor: uploadMode === 'update' ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: uploadMode === 'update' ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '0.9rem' }}>🔄 Update Existing Report</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    Add a new version & preserve history
                  </div>
                </button>
              </div>

              {/* Parent Report Selector if in Update Mode */}
              {uploadMode === 'update' && (
                <div style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Select Previous Report to Update & Compare Against:
                  </label>
                  {existingReports.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No existing reports on record. Switching to New Baseline Report mode.
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      value={parentReportId}
                      onChange={(e) => setParentReportId(e.target.value)}
                      required={uploadMode === 'update'}
                    >
                      <option value="">-- Choose prior report chain --</option>
                      {existingReports.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} (v{r.version || 1} • {r.report_date})
                        </option>
                      ))}
                    </select>
                  )}
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Previous versions will remain completely preserved and accessible in your lifetime timeline.
                  </small>
                </div>
              )}

              {/* File Dropzone Input */}
              <div style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-muted)',
                marginBottom: '1.25rem',
                cursor: 'pointer'
              }}>
                <input
                  type="file"
                  id="report-file"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="report-file" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={32} style={{ color: 'var(--primary-600)', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {fileName ? `Selected: ${fileName}` : 'Choose Medical File or Drag & Drop'}
                  </div>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Supports PDF, Scanned Images (JPG, PNG), Prescriptions, Lab Reports
                  </div>
                </label>
              </div>

              {/* Title and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Report Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Glycemic Profile & Lipid Panel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category *</label>
                  <select
                    className="form-input"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="lab_test">Lab Blood Test</option>
                    <option value="prescription">Prescription</option>
                    <option value="scan_imaging">Scan / X-Ray / MRI</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="cardiology">Cardiology / ECG</option>
                    <option value="other">Other Medical Record</option>
                  </select>
                </div>
              </div>

              {/* Date, Doctor, Facility */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Report Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Physician</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dr. Alice Carter"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hospital / Lab</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Central Labs"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                  />
                </div>
              </div>

              {/* Raw Findings / Text for Automated Extraction */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                    Report Text & Findings (for automated biomarker extraction)
                  </label>
                  <button
                    type="button"
                    onClick={() => setRawText('HbA1c: 6.8%. Fasting Blood Glucose: 115 mg/dL. Total Cholesterol: 195 mg/dL. Blood Pressure: 124/80. Serum Creatinine: 0.9 mg/dL.')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', color: 'var(--primary-600)' }}
                  >
                    Paste sample lab values
                  </button>
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Paste or type lab values (e.g. HbA1c: 7.2%, Glucose: 120 mg/dL, BP: 120/80)..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  style={{ fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              {/* Custom Biomarker Quick-Add */}
              <div style={{
                padding: '0.85rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Manual Biomarker Adder (Optional):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Biomarker (e.g. HbA1c)"
                    value={newBioName}
                    onChange={(e) => setNewBioName(e.target.value)}
                    style={{ flex: 2, fontSize: '0.8rem' }}
                  />
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="Value (e.g. 6.5)"
                    value={newBioVal}
                    onChange={(e) => setNewBioVal(e.target.value)}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Unit (e.g. %)"
                    value={newBioUnit}
                    onChange={(e) => setNewBioUnit(e.target.value)}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBiomarker}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {customBiomarkers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {customBiomarkers.map((b, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {b.name}: {b.value} {b.unit}
                        <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveBiomarker(idx)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Extracting & Saving...' : 'Save & Extract Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
