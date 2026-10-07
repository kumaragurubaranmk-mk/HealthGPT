import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  Edit,
  Shield,
  Users,
  Clock,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Filter
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Modal } from '../../components/Modal';

export function AdminMedicinesPage() {
  const { adminToken } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' | 'guardians' | 'reports' | 'alerts'
  
  const [medicines, setMedicines] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [editingGuardian, setEditingGuardian] = useState(null);

  // Form State for Add/Edit Medicine
  const [medForm, setMedForm] = useState({
    user_id: '',
    medicine_name: '',
    dosage: '',
    frequency: 'Once daily',
    reminder_time: '08:00 AM',
    instructions: 'Take after food with water',
    status: 'active'
  });

  useEffect(() => {
    if (!adminToken) return;
    loadAllAdminData();
  }, [adminToken]);

  const loadAllAdminData = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${adminToken}` };

    try {
      const [medRes, guardRes, repRes, alertRes, userRes] = await Promise.all([
        fetch('/api/admin/medicines', { headers }),
        fetch('/api/admin/guardians', { headers }),
        fetch('/api/admin/reports', { headers }),
        fetch('/api/admin/alerts', { headers }),
        fetch('/api/admin/users', { headers })
      ]);

      if (medRes.ok) {
        const d = await medRes.json();
        setMedicines(d.medicines || []);
      }
      if (guardRes.ok) {
        const d = await guardRes.json();
        setGuardians(d.guardians || []);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
        setPrescriptions(d.prescriptions || []);
      }
      if (alertRes.ok) {
        const d = await alertRes.json();
        setAlerts(d.alerts || []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setUsersList(d.users || []);
      }
    } catch (err) {
      console.error('Error loading admin medicine operations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    };

    try {
      if (editingMed) {
        // Update
        const res = await fetch(`/api/admin/medicines/${editingMed.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(medForm)
        });
        if (res.ok) {
          setIsAddMedOpen(false);
          setEditingMed(null);
          loadAllAdminData();
        }
      } else {
        // Create
        const res = await fetch('/api/admin/medicines', {
          method: 'POST',
          headers,
          body: JSON.stringify(medForm)
        });
        if (res.ok) {
          setIsAddMedOpen(false);
          setEditingMed(null);
          loadAllAdminData();
        } else {
          const d = await res.json();
          alert(d.error || 'Failed to add medicine');
        }
      }
    } catch (err) {
      console.error('Error saving medicine:', err);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication schedule?')) return;
    try {
      const res = await fetch(`/api/admin/medicines/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) loadAllAdminData();
    } catch (err) {
      console.error('Error deleting medicine:', err);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this health document/prescription?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) loadAllAdminData();
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const filteredMeds = medicines.filter(m =>
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.patient_name && m.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-body" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Pill size={26} color="#0284c7" />
            Medicines, Schedules & Clinical Governance
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Administrative management of patient medications, guardian escalation records, and verified adherence.
          </p>
        </div>

        {activeTab === 'medicines' && (
          <button
            onClick={() => {
              setEditingMed(null);
              setMedForm({
                user_id: usersList[0]?.id || '',
                medicine_name: '',
                dosage: '',
                frequency: 'Once daily',
                reminder_time: '08:00 AM',
                instructions: 'Take after meal',
                status: 'active'
              });
              setIsAddMedOpen(true);
            }}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.65rem',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Plus size={16} /> + Add Medicine Schedule
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'medicines', label: `Medicines & Schedules (${medicines.length})`, icon: Pill },
          { id: 'guardians', label: `Guardians (${guardians.length})`, icon: Users },
          { id: 'reports', label: `Reports & Prescriptions (${reports.length + prescriptions.length})`, icon: FileText },
          { id: 'alerts', label: `Escalation History (${alerts.length})`, icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.92rem',
                padding: '0.65rem 0.5rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '-2px',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEDICINES & SCHEDULES */}
      {activeTab === 'medicines' && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '380px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by medicine or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.85rem', border: '1.5px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Medicine Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Dosage</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Schedule Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assigned Patient</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No medication records found.
                    </td>
                  </tr>
                ) : (
                  filteredMeds.map((med) => (
                    <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        💊 {med.medicine_name}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#334155' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', fontWeight: 600 }}>
                          {med.dosage}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#0284c7' }}>
                        {med.reminder_time}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                        <div style={{ fontWeight: 600 }}>{med.patient_name || 'Patient'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{med.patient_email || '—'}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ backgroundColor: med.status === 'active' ? '#ecfdf5' : '#f1f5f9', color: med.status === 'active' ? '#059669' : '#64748b', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {med.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setEditingMed(med);
                              setMedForm({
                                user_id: med.user_id,
                                medicine_name: med.medicine_name,
                                dosage: med.dosage,
                                frequency: med.frequency,
                                reminder_time: med.reminder_time,
                                instructions: med.instructions || '',
                                status: med.status
                              });
                              setIsAddMedOpen(true);
                            }}
                            style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '0.35rem', padding: '0.35rem', cursor: 'pointer', color: '#0284c7' }}
                            title="Edit Medicine"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(med.id)}
                            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '0.35rem', padding: '0.35rem', cursor: 'pointer', color: '#dc2626' }}
                            title="Delete Medicine"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GUARDIANS */}
      {activeTab === 'guardians' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.85rem', border: '1.5px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem' }}>Guardian Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Associated Patient</th>
                <th style={{ padding: '0.85rem 1rem' }}>Phone Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Relationship</th>
                <th style={{ padding: '0.85rem 1rem' }}>Escalation Status</th>
              </tr>
            </thead>
            <tbody>
              {guardians.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No registered guardians yet.
                  </td>
                </tr>
              ) : (
                guardians.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      👤 {g.name}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                      {g.patient_name || 'Patient'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#0284c7' }}>
                      📞 {g.phone}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                      {g.relationship || 'Primary Guardian'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {g.escalation_enabled ? 'Active Escalation Target' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: REPORTS & PRESCRIPTIONS */}
      {activeTab === 'reports' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.85rem', border: '1.5px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem' }}>Document / File</th>
                <th style={{ padding: '0.85rem 1rem' }}>Patient Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Uploaded Date</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No uploaded health reports or prescriptions found.
                  </td>
                </tr>
              ) : (
                [...reports, ...prescriptions].map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      📄 {doc.file_name || doc.document_name || 'Medical Document'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                      {doc.patient_name || 'Patient'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {doc.document_type || 'Prescription / Lab'}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteReport(doc.id)}
                        style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '0.35rem', padding: '0.35rem', cursor: 'pointer', color: '#dc2626' }}
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: ALERT & ESCALATION HISTORY */}
      {activeTab === 'alerts' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.85rem', border: '1.5px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Alert Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Recipient Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>Dispatched Message</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No escalation alerts in database.
                  </td>
                </tr>
              ) : (
                alerts.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {a.alert_type === 'intake_verified' ? (
                        <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>
                          Intake Verified
                        </span>
                      ) : a.alert_type === 'patient_warning_1' ? (
                        <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>
                          Warning Call #1
                        </span>
                      ) : a.alert_type === 'patient_warning_2' ? (
                        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>
                          Warning Call #2
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>
                          🚨 Guardian Escalation
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 600 }}>
                      {a.recipient_name || 'Guardian'} ({a.recipient_phone || 'Phone'})
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {a.message}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                      {a.status || 'DELIVERED'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isAddMedOpen}
        onClose={() => {
          setIsAddMedOpen(false);
          setEditingMed(null);
        }}
        title={editingMed ? 'Edit Medication Schedule' : 'Create Medication Schedule'}
      >
        <form onSubmit={handleSaveMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Assign to User / Patient *
            </label>
            <select
              required
              value={medForm.user_id}
              onChange={(e) => setMedForm({ ...medForm, user_id: e.target.value })}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            >
              {usersList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Medicine Name *
            </label>
            <input
              type="text"
              required
              value={medForm.medicine_name}
              onChange={(e) => setMedForm({ ...medForm, medicine_name: e.target.value })}
              placeholder="e.g. Paracetamol, Metformin"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Dosage *
              </label>
              <input
                type="text"
                required
                value={medForm.dosage}
                onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                placeholder="e.g. 500mg, 1 tablet"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Scheduled Time *
              </label>
              <input
                type="text"
                required
                value={medForm.reminder_time}
                onChange={(e) => setMedForm({ ...medForm, reminder_time: e.target.value })}
                placeholder="e.g. 08:00 AM, 02:00 PM"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Instructions
            </label>
            <input
              type="text"
              value={medForm.instructions}
              onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
              placeholder="e.g. Take after meal with water"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsAddMedOpen(false);
                setEditingMed(null);
              }}
              style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {editingMed ? 'Update Medicine' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
