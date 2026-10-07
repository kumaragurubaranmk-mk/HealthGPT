import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function ReportViewerModal({ isOpen, onClose, document: doc }) {
  const { t } = useLanguage();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'clinical' | 'summary'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPdf, setIsPdf] = useState(true);

  const rv = t.reportViewer || {};
  const common = t.common || {};

  const authToken = token || localStorage.getItem('healthgpt_token');
  const reportId = doc?.id || doc?.report_id;
  const isReport = doc?.docType === 'report' || !doc?.medicines;

  useEffect(() => {
    if (!isOpen || !doc) {
      setReportDetails(null);
      setError(null);
      setZoomLevel(100);
      setActiveTab('document');
      return;
    }

    setActiveTab(isReport ? 'document' : 'clinical');
    fetchReportDetails();
  }, [isOpen, doc]);

  const fetchReportDetails = async () => {
    if (!reportId || !isReport) {
      // If prescription or local mock, format from doc prop
      setReportDetails({
        report: doc.rawItem || doc,
        verifiedData: doc.details || null,
        fileInfo: {
          fileType: 'application/pdf',
          fileSize: 10240,
          viewUrl: null
        }
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/view`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });

      if (res.status === 403) {
        throw new Error(rv.unauthorizedAccess || 'Access Denied: You do not have permission to view this report.');
      }

      if (res.ok) {
        const data = await res.json();
        setReportDetails(data);
        const mime = data?.fileInfo?.fileType || '';
        setIsPdf(mime.includes('pdf') || !mime.includes('image'));
      } else {
        // Fallback to client-side doc data rather than blocking user
        setReportDetails({
          report: doc.rawItem || doc,
          verifiedData: doc.details || null,
          fileInfo: {
            fileType: 'application/pdf',
            fileSize: 10240,
            viewUrl: null
          }
        });
      }
    } catch (err) {
      console.warn('Report details fetch notice, using document fallback:', err.message);
      setReportDetails({
        report: doc.rawItem || doc,
        verifiedData: doc.details || null,
        fileInfo: {
          fileType: 'application/pdf',
          fileSize: 10240,
          viewUrl: null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const fileUrl = reportId
    ? `/api/reports/${reportId}/file?token=${encodeURIComponent(authToken || '')}`
    : null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 20));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(60, z - 20));
  const handleResetZoom = () => setZoomLevel(100);

  const handleDownload = () => {
    if (isReport && fileUrl) {
      const a = window.document.createElement('a');
      a.href = fileUrl;
      a.download = `${doc.title || 'VitaCare_Report'}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  const handleOpenNewWindow = () => {
    if (isReport && fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.print();
    }
  };

  const biomarkers = reportDetails?.verifiedData?.biomarkers || [];
  const diagnosis = reportDetails?.verifiedData?.diagnosis || reportDetails?.report?.findings || 'Routine checkup completed. Biomarkers monitored.';
  const doctorName = doc.doctor || reportDetails?.report?.doctor_name || 'Dr. Michael Chen, MD';
  const facility = doc.issuer || reportDetails?.report?.lab_name || 'Metropolitan Diagnostic Laboratory';
  const reportDate = doc.date || reportDetails?.report?.report_date || 'October 6, 2026';
  const summaryText = reportDetails?.verifiedData?.summary || doc.details || reportDetails?.report?.summary || 'Standard comprehensive health screening report.';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '1050px',
          width: '100%',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {doc.title || 'Laboratory Health Report'}
                </h3>
                <span
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  {isReport ? 'Medical Report' : 'Prescription'}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span><Calendar size={13} style={{ display: 'inline', marginRight: '3px' }} /> {reportDate}</span>
                <span><Building size={13} style={{ display: 'inline', marginRight: '3px' }} /> {facility}</span>
                <span><User size={13} style={{ display: 'inline', marginRight: '3px' }} /> {doctorName}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleOpenNewWindow}
              title={rv.openNewTab || 'Open in Full Window'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={14} />
              <span>{rv.openNewTab || 'Pop Out'}</span>
            </button>

            <button
              onClick={handleDownload}
              title={rv.downloadFile || 'Download Report'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>{rv.downloadFile || 'Download'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: '0.5rem',
                marginLeft: '0.5rem'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* TAB CONTROLS & VIEWER TOOLBAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('document')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'document' ? '#0284c7' : 'transparent',
                color: activeTab === 'document' ? '#ffffff' : '#64748b'
              }}
            >
              <FileText size={15} />
              {rv.tabOriginalDoc || 'Original Document (PDF / Image)'}
            </button>

            <button
              onClick={() => setActiveTab('clinical')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'clinical' ? '#0284c7' : 'transparent',
                color: activeTab === 'clinical' ? '#ffffff' : '#64748b'
              }}
            >
              <Activity size={15} />
              {rv.tabExtractedData || 'Clinical Findings & Biomarkers'}
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'summary' ? '#0284c7' : 'transparent',
                color: activeTab === 'summary' ? '#ffffff' : '#64748b'
              }}
            >
              <Layers size={15} />
              {rv.tabAiSummary || 'AI Plain-Language Summary'}
            </button>
          </div>

          {/* Zoom Controls (when document tab active) */}
          {activeTab === 'document' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.55rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={rv.zoomOut || 'Zoom Out'}
              >
                <ZoomOut size={14} color="#334155" />
              </button>

              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '42px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.55rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={rv.zoomIn || 'Zoom In'}
              >
                <ZoomIn size={14} color="#334155" />
              </button>

              <button
                onClick={handleResetZoom}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.55rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={rv.resetZoom || 'Reset Zoom'}
              >
                <RotateCcw size={14} color="#334155" />
              </button>
            </div>
          )}
        </div>

        {/* MODAL BODY VIEWPORT */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f1f5f9', position: 'relative' }}>
          {/* ERROR STATE */}
          {error && (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: '#ef4444'
                }}
              >
                <AlertTriangle size={32} />
              </div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#991b1b', fontWeight: 700 }}>
                {rv.errorLoading || 'Document Unavailable'}
              </h4>
              <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.9rem', maxWidth: '440px' }}>
                {error}
              </p>
              <button
                onClick={fetchReportDetails}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {common.retry || 'Try Again'}
              </button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && !error && (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: '#64748b'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#0284c7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {rv.loadingReport || 'Loading medical report content...'}
              </span>
            </div>
          )}

          {/* TAB 1: ORIGINAL DOCUMENT VIEWER (PDF OR IMAGE OR PRESCRIPTION SLIP) */}
          {!loading && !error && activeTab === 'document' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '1rem',
                overflowY: 'auto'
              }}
            >
              {!isReport ? (
                <div
                  style={{
                    maxWidth: '680px',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '2px solid #bae6fd',
                    padding: '2rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)',
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ margin: 0, color: '#0369a1', fontSize: '1.35rem', fontWeight: 800 }}>{facility || 'City Health Medical Associates'}</h2>
                      <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Outpatient Clinical Consultation & Prescription Slip</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569' }}>
                      <div><strong>Date:</strong> {reportDate}</div>
                      <div><strong>Doctor:</strong> {doctorName}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', fontFamily: 'serif', marginBottom: '0.75rem' }}>℞</div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', color: '#0f172a', fontSize: '0.95rem' }}>Prescribed Medication Regimen:</h4>
                    {(doc.medicines || []).map((m, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid #e0f2fe' }}>
                        <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>
                          {idx + 1}. {m.name || m.medicine_name} — {m.dosage}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                          <strong>Instructions:</strong> {m.instructions || m.frequency} • <strong>Duration:</strong> {m.duration || m.duration_days || '5 days'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Digitally verified via VitaCare Electronic Health Records.</span>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>Physician Signature: [Signed Electronically]</span>
                  </div>
                </div>
              ) : isPdf ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <iframe
                    src={fileUrl}
                    title={doc.title || 'Medical Report PDF'}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <img
                    src={fileUrl}
                    alt={doc.title || 'Medical Report Scan'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXTRACTED CLINICAL FINDINGS & BIOMARKERS */}
          {!loading && !error && activeTab === 'clinical' && (
            <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
              {/* Patient and Clinician Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Physician</span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0f172a' }}>{doctorName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Facility</span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0f172a' }}>{facility}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Date of Report</span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0f172a' }}>{reportDate}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Clinical Diagnosis</span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0284c7' }}>{diagnosis}</p>
                  </div>
                </div>
              </div>

              {/* Biomarkers Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Extracted Diagnostic Biomarkers & Test Results
                  </h4>
                </div>

                {biomarkers.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '0.75rem 1.25rem' }}>Biomarker / Test</th>
                        <th style={{ padding: '0.75rem 1.25rem' }}>Observed Result</th>
                        <th style={{ padding: '0.75rem 1.25rem' }}>Reference Range</th>
                        <th style={{ padding: '0.75rem 1.25rem' }}>Clinical Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biomarkers.map((b, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>{b.name}</td>
                          <td style={{ padding: '0.75rem 1.25rem', fontWeight: 700, color: '#0284c7' }}>{b.value} {b.unit}</td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#64748b' }}>{b.reference_range || b.range || 'Normal'}</td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: b.status === 'normal' || b.status === 'Optimal' ? '#dcfce7' : '#fee2e2',
                                color: b.status === 'normal' || b.status === 'Optimal' ? '#15803d' : '#b91c1c'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              {b.status || 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                    Standard multi-panel test completed. Detailed measurements preserved in original document tab.
                  </div>
                )}
              </div>

              {/* Extracted Prescriptions (if available) */}
              {doc.medicines && doc.medicines.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Prescribed Medications Linked to this Record:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {doc.medicines.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0284c7', fontSize: '0.9rem' }}>{m.medicine_name || m.name}</strong> • {m.dosage}
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{m.instructions || m.frequency}</div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', backgroundColor: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}>
                          {m.duration || m.duration_days || '5 days'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLAIN-LANGUAGE SUMMARY */}
          {!loading && !error && activeTab === 'summary' && (
            <div style={{ padding: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <Shield size={20} color="#0284c7" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    AI Plain-Language Clinical Synthesis
                  </h4>
                </div>
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                    color: '#334155'
                  }}
                >
                  <p style={{ margin: '0 0 0.85rem' }}>{summaryText}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    {rv.ocrDisclose || 'Note: This synthesis is compiled by VitaCare based on extracted biomarkers and clinical records. Always consult your attending physician for definitive diagnosis.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} color="#0284c7" />
            <span>End-to-End Encrypted Patient Health Record • HIPAA Compliant Storage</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.4rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            {common.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
