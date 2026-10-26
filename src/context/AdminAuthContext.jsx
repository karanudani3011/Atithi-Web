import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminProfile, getAdminSession, listenAdminAuth, signInAdmin, signOutAdmin } from '../services/admin/adminAuthService.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async (nextSession) => {
    setSession(nextSession || null);
    if (!nextSession?.user) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await getAdminProfile(nextSession.user.id);
      if (!profile) {
        setUser(null);
        setAuthError('Access denied. This account is not an Atithi administrator.');
        try { await signOutAdmin(); } catch { /* Keep the access-denied message visible. */ }
        return;
      }
      setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role });
      setAuthError('');
    } catch (error) {
      setUser(null);
      setAuthError(error?.message || 'Could not verify the admin profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAdminSession().then((currentSession) => active && resolve(currentSession)).catch((error) => {
      if (!active) return;
      setUser(null);
      setSession(null);
      setAuthError(error?.message || 'Could not restore the admin session.');
      setLoading(false);
    });
    const { data: { subscription } } = listenAdminAuth((_event, nextSession) => {
      if (active) queueMicrotask(() => active && resolve(nextSession));
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [resolve]);

  const login = useCallback(async (id, password) => {
    setAuthError('');
    const result = await signInAdmin(id, password);
    setSession(result.session || null);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await signOutAdmin();
    setSession(null);
    setUser(null);
    setAuthError('');
  }, []);

  const value = useMemo(() => ({ user, session, authError, loading, login, logout,
    isAuthenticated: Boolean(session?.user && user), isSuperAdmin: user?.role === 'super_admin' }),
  [user, session, authError, loading, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('useAdminAuth must be inside AdminAuthProvider.');
  return value;
}

