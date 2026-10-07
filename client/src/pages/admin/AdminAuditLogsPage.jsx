import React, { useState, useEffect } from 'react';
import { ScrollText, Shield, Clock, Terminal } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminAuditLogsPage() {
  const { adminToken } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;

    fetch('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load audit logs:', err);
        setLoading(false);
      });
  }, [adminToken]);

  return (
    <div className="dashboard-body">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <ScrollText size={28} style={{ color: 'var(--accent-amber)' }} />
          System Security & Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Immutable logging of administrative actions, authentication attempts, and operational updates.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit events recorded yet.
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Target Type</th>
                  <th>Details & Context</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.target_type}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ip_address || '127.0.0.1'}
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
