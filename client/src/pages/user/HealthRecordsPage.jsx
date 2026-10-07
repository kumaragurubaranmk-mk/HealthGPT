import React, { useState, useEffect } from 'react';
import {
  FileText,
  Pill,
  Search,
  Filter,
  Calendar,
  Trash2,
  Eye,
  Plus,
  FilePlus,
  Sparkles,
  Building,
  User,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AddHealthReportModal } from '../../components/AddHealthReportModal';
import { AddPrescriptionModal } from '../../components/AddPrescriptionModal';
import { Modal } from '../../components/Modal';
import { ReportViewerModal } from '../../components/ReportViewerModal';

export function HealthRecordsPage() {
  const { token, isDemoMode } = useAuth();

  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'report' | 'prescription'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isAddRxOpen, setIsAddRxOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [token, isDemoMode]);

  const fetchDocuments = async () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('healthgpt_token');
    const headers = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    try {
      const [reportsRes, rxRes] = await Promise.all([
        fetch('/api/reports', { headers }).then(r => r.ok ? r.json() : { reports: [] }).catch(() => ({ reports: [] })),
        fetch('/api/prescriptions', { headers }).then(r => r.ok ? r.json() : { prescriptions: [] }).catch(() => ({ prescriptions: [] }))
      ]);

      setReports(reportsRes.reports || []);
      setPrescriptions(rxRes.prescriptions || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this health report from your records?')) return;
    const authToken = token || localStorage.getItem('healthgpt_token');
    try {
      await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
      });
      setReports(prev => prev.filter(r => r.id !== id));
      if (viewingDoc?.id === id) setViewingDoc(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDeletePrescription = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this prescription from your records?')) return;
    const authToken = token || localStorage.getItem('healthgpt_token');
    try {
      await fetch(`/api/prescriptions/${id}`, {
        method: 'DELETE',
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
      });
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      if (viewingDoc?.id === id) setViewingDoc(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Combine documents into unified cards
  const allDocuments = [
    ...reports.map(r => ({
      id: r.id,
      docType: 'report',
      title: r.title || 'Laboratory Blood Report',
      date: r.report_date || 'October 6, 2026',
      issuer: r.facility_name || r.lab_name || 'Metropolitan Diagnostics Laboratory',
      doctor: r.doctor_name || 'Dr. Michael Chen, MD',
      details: r.ai_summary || r.summary || (typeof r.verified_data === 'string' && !r.verified_data.startsWith('[') ? r.verified_data : 'Standard comprehensive health screening report.'),
      rawItem: r
    })),
    ...prescriptions.map(p => {
      let meds = [];
      if (Array.isArray(p.verified_medicines)) {
        meds = p.verified_medicines;
      } else if (typeof p.verified_medicines === 'string' && p.verified_medicines.trim()) {
        try { meds = JSON.parse(p.verified_medicines); } catch (e) { meds = []; }
      }
      return {
        id: p.id,
        docType: 'prescription',
        title: p.title || 'Clinical Prescription',
        date: p.prescription_date || 'October 6, 2026',
        issuer: p.facility_name || 'City Health Medical Associates',
        doctor: p.doctor_name || 'Dr. Michael Chen, MD',
        medicines: meds,
        rawItem: p
      };
    })
  ];

  const handleQuickSampleReport = async () => {
    const authToken = token || localStorage.getItem('healthgpt_token');
    try {
      const res = await fetch('/api/reports/samples', {
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
      });
      const data = await res.json();
      const sample = data.samples?.[0];
      if (sample) {
        await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({
            title: sample.title,
            report_type: sample.reportType || 'lab_test',
            report_date: sample.reportDate,
            doctor_name: sample.doctorName,
            facility_name: sample.facilityName,
            raw_text: sample.rawText
          })
        });
        fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to load sample report:', err);
    }
  };

  const filteredDocs = allDocuments.filter(doc => {
    if (activeFilter !== 'all' && doc.docType !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title?.toLowerCase().includes(q);
      const matchDoc = doc.doctor?.toLowerCase().includes(q);
      const matchDate = doc.date?.toLowerCase().includes(q);
      return matchTitle || matchDoc || matchDate;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* HEADER SECTION */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.25rem 1.75rem',
          border: '1.5px solid #e0f2fe',
          boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}
            >
              Document Vault & OCR Archives
            </span>
          </div>
          <h1 style={{ margin: '0.3rem 0 0.15rem', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Health Reports & Prescriptions
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
            Search, filter, view OCR details, and manage clinical records in one secure hub.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddRxOpen(true)}
            style={{
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #0284c7',
              color: '#0284c7',
              borderRadius: '0.65rem',
              padding: '0.65rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Pill size={16} /> [ + ADD PRESCRIPTION ]
          </button>

          <button
            onClick={() => setIsAddReportOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '0.65rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <FilePlus size={16} /> [ + ADD HEALTH REPORT ]
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search reports by title, doctor, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'report', label: 'Blood Reports' },
            { id: 'prescription', label: 'Prescriptions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: activeFilter === tab.id ? 700 : 500,
                backgroundColor: activeFilter === tab.id ? '#0284c7' : '#f8fafc',
                color: activeFilter === tab.id ? '#ffffff' : '#475569',
                border: `1px solid ${activeFilter === tab.id ? '#0284c7' : '#cbd5e1'}`,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENT CARDS GRID (REQUIREMENT 13) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredDocs.map((doc) => {
          const isReport = doc.docType === 'report';

          return (
            <div
              key={`${doc.docType}-${doc.id}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '1.5px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '0.5rem',
                        backgroundColor: isReport ? '#e0f2fe' : '#ecfdf5',
                        color: isReport ? '#0284c7' : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isReport ? <FileText size={18} /> : <Pill size={18} />}
                    </div>
                    <span
                      style={{
                        backgroundColor: isReport ? '#e0f2fe' : '#ecfdf5',
                        color: isReport ? '#0369a1' : '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}
                    >
                      {isReport ? 'Blood Test Report' : 'Prescription'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => isReport ? handleDeleteReport(doc.id, e) : handleDeletePrescription(doc.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      borderRadius: '0.3rem'
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* EXACT SPEC CARD VIEW */}
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {doc.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} /> {doc.date}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4 }}>
                  <div><strong>Doctor:</strong> {doc.doctor || 'Dr. Michael Chen, MD'}</div>
                  <div><strong>Facility:</strong> {doc.issuer || 'Metropolitan Diagnostics'}</div>
                </div>
              </div>

              {/* ACTION BUTTON (REQUIREMENT 13: [View Report] or [View Prescription]) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <button
                  onClick={() => setViewingDoc(doc)}
                  style={{
                    width: '100%',
                    backgroundColor: isReport ? '#f0f9ff' : '#f0fdf4',
                    border: `1.5px solid ${isReport ? '#0284c7' : '#10b981'}`,
                    color: isReport ? '#0284c7' : '#059669',
                    borderRadius: '0.6rem',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Eye size={15} />
                  {isReport ? '[ View Report ]' : '[ View Prescription ]'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              border: '1.5px dashed #cbd5e1',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <FileText size={28} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              No Medical Documents Found
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#64748b', maxWidth: '440px' }}>
              Upload your diagnostic laboratory reports, doctor prescriptions, or load a verified clinical sample report to extract biomarkers and monitor trends.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setIsAddReportOpen(true)}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.6rem',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <FilePlus size={16} /> [ + ADD HEALTH REPORT ]
              </button>
              <button
                onClick={handleQuickSampleReport}
                style={{
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  border: '1.5px solid #0284c7',
                  borderRadius: '0.6rem',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Sparkles size={16} /> Load Verified Sample Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT & HEALTH REPORT VIEWER (FULL ACTUAL CONTENT SUPPORT) */}
      <ReportViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* UPLOAD MODALS */}
      <AddHealthReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        onReportSaved={() => {
          setIsAddReportOpen(false);
          fetchDocuments();
        }}
      />

      <AddPrescriptionModal
        isOpen={isAddRxOpen}
        onClose={() => setIsAddRxOpen(false)}
        onPrescriptionSaved={() => {
          setIsAddRxOpen(false);
          fetchDocuments();
        }}
      />
    </div>
  );
}
