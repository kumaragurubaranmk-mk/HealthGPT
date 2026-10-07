import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Phone, Mail, ShieldAlert, CheckCircle2, Trash2, Send, X, Bell } from 'lucide-react';

export function GuardianManagerModal({ isOpen, onClose }) {
  const [guardians, setGuardians] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Guardian form state
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Family Member');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [escalationTimeout, setEscalationTimeout] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadGuardians();
    }
  }, [isOpen]);

  const loadGuardians = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/guardians', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGuardians(data.guardians || []);
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load guardians:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/guardians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          relation,
          phone,
          email,
          escalation_enabled: 1,
          escalation_timeout_mins: parseInt(escalationTimeout) || 15
        })
      });

      if (res.ok) {
        setName('');
        setPhone('');
        setEmail('');
        setShowAddForm(false);
        await loadGuardians();
      }
    } catch (err) {
      alert(`Failed to add guardian: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuardian = async (id) => {
    if (!confirm('Remove this guardian?')) return;
    try {
      const token = localStorage.getItem('healthgpt_token');
      await fetch(`/api/guardians/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await loadGuardians();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestAlert = async (guardianId) => {
    try {
      const token = localStorage.getItem('healthgpt_token');
      const res = await fetch('/api/guardians/alerts/send-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          guardian_id: guardianId,
          medicine_name: 'Metformin 500mg',
          scheduled_time: '08:00 AM',
          reason: 'Simulated missed medicine window test'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult(data);
        await loadGuardians();
      }
    } catch (err) {
      alert(`Test alert error: ${err.message}`);
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} style={{ color: 'var(--primary-600)' }} />
              Guardian Management & Escalation Alerts
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Configure family care contacts who receive automatic alarms when medication doses are missed
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Test Alert Confirmation Toast if sent */}
          {testResult && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--accent-emerald-subtle)',
              border: '1px solid var(--accent-emerald)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-emerald)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '0.85rem' }}>
                <strong>{testResult.message}</strong>
                <div style={{ fontSize: '0.785rem', marginTop: '2px' }}>
                  Recipient: {testResult.recipient?.name} ({testResult.recipient?.phone})
                </div>
              </div>
              <button onClick={() => setTestResult(null)} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Guardians Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Registered Guardians ({guardians.length})
            </h3>
            {!showAddForm && (
              <button onClick={() => setShowAddForm(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserPlus size={15} /> Add Guardian
              </button>
            )}
          </div>

          {/* Add Guardian Form */}
          {showAddForm && (
            <form onSubmit={handleAddGuardian} style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
                Register New Guardian Contact
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Robert Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Relationship</label>
                  <select
                    className="form-input"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son / Daughter">Son / Daughter</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Caregiver">Caregiver / Nurse</option>
                    <option value="Friend">Friend / Neighbor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mobile Phone *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 912-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="guardian@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Escalation Timeout: Alert guardian if medicine is not taken within:
                </label>
                <select
                  className="form-input"
                  value={escalationTimeout}
                  onChange={(e) => setEscalationTimeout(e.target.value)}
                >
                  <option value={10}>10 minutes after scheduled time</option>
                  <option value={15}>15 minutes after scheduled time (Recommended)</option>
                  <option value={30}>30 minutes after scheduled time</option>
                  <option value={60}>1 hour after scheduled time</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Saving...' : 'Save Guardian'}
                </button>
              </div>
            </form>
          )}

          {/* List of Guardians */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              Loading guardian records...
            </div>
          ) : guardians.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem'
            }}>
              No guardian contacts added yet. Add a family member to activate safety escalation alerts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {guardians.map(g => (
                <div key={g.id} style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{g.name}</strong>
                      <span className="badge badge-primary">{g.relation}</span>
                      <span className="badge badge-demo">Escalation Active ({g.escalation_timeout_mins}m)</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={13} /> {g.phone}
                      </span>
                      {g.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail size={13} /> {g.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSendTestAlert(g.id)}
                      className="btn btn-secondary btn-sm"
                      title="Send test demo alert"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Send size={13} /> Test Demo Alert
                    </button>
                    <button
                      onClick={() => handleDeleteGuardian(g.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger-500)', padding: '0.35rem' }}
                      title="Remove guardian"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guardian Alert History Log */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={16} style={{ color: 'var(--accent-amber)' }} />
              Recent Guardian Escalation Logs ({alerts.length})
            </h3>

            {alerts.length === 0 ? (
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                No escalation alerts recorded. When doses are missed, alerts will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {alerts.map(a => (
                  <div key={a.id} style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ color: 'var(--danger-600)' }}>
                        {a.medicine_name} • Scheduled: {a.scheduled_time}
                      </strong>
                      <span className="badge badge-demo" style={{ fontSize: '0.685rem' }}>
                        DEMO NOTIFICATION
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{a.message}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                      Logged: {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-muted)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
