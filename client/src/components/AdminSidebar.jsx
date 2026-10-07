import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  FileEdit,
  BookOpenText,
  MessageSquareWarning,
  ScrollText,
  Sliders,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminSidebar() {
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard Overview', icon: ShieldAlert },
    { to: '/admin/medicines', label: 'Medicines & Schedules', icon: Users },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/content', label: 'Educational CMS', icon: FileEdit },
    { to: '/admin/medical-dictionary', label: 'Medical Dictionary CMS', icon: BookOpenText },
    { to: '/admin/feedback', label: 'Feedback & Reports', icon: MessageSquareWarning },
    { to: '/admin/audit-logs', label: 'Security & Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'Website & Escalation Settings', icon: Sliders }
  ];

  const handleSignOut = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <aside className="sidebar" style={{ borderRight: '2px solid var(--primary-500)' }}>
      <div className="sidebar-header" style={{ backgroundColor: 'var(--primary-50)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldAlert size={22} style={{ color: 'var(--primary-600)' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--primary-700)' }}>Admin Portal</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role-Based Control</div>
          </div>
        </div>
      </div>

      <div className="sidebar-menu">
        <span className="sidebar-heading">Administration</span>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <ArrowLeft size={16} /> Return to Public App
        </button>
        <button
          onClick={handleSignOut}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-600)' }}
        >
          <LogOut size={16} /> Exit Admin Portal
        </button>
      </div>
    </aside>
  );
}
