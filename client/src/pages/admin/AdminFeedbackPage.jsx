import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminFeedbackPage() {
  const { adminToken } = useAdminAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;
    fetchFeedback();
  }, [adminToken]);

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchFeedback();
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    }
  };

  return (
    <div className="dashboard-body">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <MessageSquareWarning size={28} style={{ color: 'var(--accent-amber)' }} />
          User Feedback & Incident Reports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Review user experience submissions, bug tickets, and medical content inquiries.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {feedbackList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No user feedback submitted yet.
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category & Rating</th>
                  <th>Message / Content</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span className="badge badge-primary">{item.category}</span>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                        {'⭐'.repeat(item.rating || 5)}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.9rem', maxWidth: '350px' }}>
                      {item.message}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.user_email || 'Anonymous Patient'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'resolved' ? 'badge-success' : item.status === 'reviewed' ? 'badge-primary' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
