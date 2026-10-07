import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('healthgpt_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('healthgpt_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw data;
      }

      localStorage.setItem('healthgpt_admin_token', data.token);
      localStorage.setItem('healthgpt_admin_user', JSON.stringify(data.admin));
      setAdminToken(data.token);
      setAdmin(data.admin);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('healthgpt_admin_token');
    localStorage.removeItem('healthgpt_admin_user');
    setAdminToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        admin,
        isAdminAuthenticated: !!adminToken,
        loading,
        adminLogin,
        adminLogout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
