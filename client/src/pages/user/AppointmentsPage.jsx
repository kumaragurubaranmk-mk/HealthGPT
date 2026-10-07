import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Video,
  MapPin,
  Trash2,
  CheckCircle2,
  XCircle,
  User,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';

export function AppointmentsPage() {
  const { token, isDemoMode } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctor_name: '',
    specialty: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    location: '',
    is_virtual: false,
    notes: ''
  });

  useEffect(() => {
    if (isDemoMode) {
      setAppointments([
        {
          id: 'app-demo-1',
          doctor_name: 'Dr. Sarah Lin, MD',
          specialty: 'Cardiology Specialist',
          appointment_date: '2026-10-18',
          appointment_time: '10:30',
          location: 'Wellness Medical Plaza Suite 402',
          is_virtual: 0,
          notes: 'Routine 6-month checkup. Bring recent blood pressure logs.',
          status: 'scheduled'
        }
      ]);
      setLoading(false);
      return;
    }

    if (!token) return;

    fetchAppointments();
  }, [token, isDemoMode]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctor_name || !formData.appointment_date || !formData.appointment_time) return;

    if (isDemoMode) {
      setAppointments(prev => [{ ...formData, id: `app-demo-${Date.now()}`, status: 'scheduled' }, ...prev]);
      setIsModalOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to save appointment:', err);
    }
  };

  const handleStatusChange = async (id, status) => {
    if (isDemoMode) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAppointments();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment record?')) return;

    if (isDemoMode) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAppointments();
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    }
  };

  return (
    <div className="dashboard-body">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <Calendar size={28} style={{ color: 'var(--primary-600)' }} />
            Doctor Appointments
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage in-person clinic visits and virtual telehealth consultations.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Calendar size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Upcoming Doctor Appointments
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Keep track of your clinical consultations and preparation notes in one organized place.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Book Your First Appointment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {appointments.map(appt => (
            <div key={appt.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className={`badge ${appt.status === 'completed' ? 'badge-success' : appt.status === 'cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                    {appt.status}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {appt.is_virtual ? <Video size={14} style={{ color: 'var(--accent-indigo)' }} /> : <MapPin size={14} />}
                    {appt.is_virtual ? 'Telehealth' : 'Clinic'}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{appt.doctor_name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: '600', marginBottom: '0.75rem' }}>
                  {appt.specialty || 'General Practitioner'}
                </div>

                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <strong>{appt.appointment_date}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{appt.appointment_time}</span>
                  </div>
                </div>

                {appt.location && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{appt.location}</span>
                  </div>
                )}

                {appt.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {appt.notes}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {appt.status !== 'completed' && (
                    <button onClick={() => handleStatusChange(appt.id, 'completed')} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-emerald)' }}>
                      <CheckCircle2 size={14} /> Completed
                    </button>
                  )}
                  {appt.status !== 'cancelled' && (
                    <button onClick={() => handleStatusChange(appt.id, 'cancelled')} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }}>
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>

                <button onClick={() => handleDelete(appt.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-600)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Doctor Appointment"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Doctor Name <span className="required">*</span></label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Dr. Ananya Sharma"
              value={formData.doctor_name}
              onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Specialty / Department</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Cardiology, Dermatology, General Medicine"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time <span className="required">*</span></label>
              <input
                type="time"
                required
                className="form-control"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location or Video Meeting URL</label>
            <input
              type="text"
              className="form-control"
              placeholder="Apollo Clinic Room 204 or https://meet.google.com/..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <input
              type="checkbox"
              id="is_virtual"
              checked={formData.is_virtual}
              onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="is_virtual" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              This is a virtual telehealth consultation
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Visit Notes / Reason for Consultation</label>
            <textarea
              rows="2"
              className="form-control"
              placeholder="Follow-up on blood pressure, review lab test results..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Consultation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
