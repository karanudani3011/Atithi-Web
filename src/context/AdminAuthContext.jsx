import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';

const AdminAuthContext = createContext(null);
export function AdminAuthProvider({ children }) {
  const { user, logout } = useAuth();
  const adminUser = user?.role === 'admin' ? {
    id: user.email, name: user.email, email: user.email, role: 'admin', is_active: true,
  } : null;
  const value = useMemo(() => ({
    user: adminUser, session: adminUser ? { user: adminUser } : null, authError: '', loading: false,
    login: async () => null, logout, isAuthenticated: Boolean(adminUser), isSuperAdmin: Boolean(adminUser),
  }), [adminUser, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('useAdminAuth must be inside AdminAuthProvider.');
  return value;
}
