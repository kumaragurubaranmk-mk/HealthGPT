import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminUsersPage() {
  const { adminToken } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;
    fetchUsers();
  }, [adminToken, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      const url = new URL('/api/admin/users', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      if (searchQuery.trim()) url.searchParams.append('search', searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Change account status to ${nextStatus}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="dashboard-body">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <Users size={28} style={{ color: 'var(--primary-600)' }} />
            User Account Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage platform accounts, email verifications, and access permissions.
          </p>
        </div>

        <div style={{
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--accent-emerald-subtle)',
          color: '#065f46',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <ShieldCheck size={16} /> Privacy Guard: Zero Medical Data Exposed
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'active', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="form-control"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered users found matching the query.
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>Guardian Details</th>
                  <th>Verification</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                        Joined: {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {u.email}
                      </div>
                      {u.phone && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <Phone size={13} /> {u.phone}
                        </div>
                      )}
                    </td>

                    <td>
                      {u.guardian_email || u.guardian_phone ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {u.guardian_email && <div>{u.guardian_email}</div>}
                          {u.guardian_phone && <div style={{ color: 'var(--text-muted)' }}>{u.guardian_phone}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not provided</span>
                      )}
                    </td>

                    <td>
                      {u.is_verified ? (
                        <span className="badge badge-success">Verified</span>
                      ) : (
                        <span className="badge badge-warning">Pending OTP</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '0.35rem 0.75rem' }}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
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
