import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminProfile, getAdminSession, listenAdminAuth, signInAdmin, signOutAdmin } from '../services/admin/adminAuthService.js';
const AdminAuthContext = createContext(null);
export function AdminAuthProvider({ children }) {
 const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
 const resolve = useCallback(async authSession => { if (!authSession?.user) { setUser(null); setLoading(false); return; } setLoading(true); try { const profile = await getAdminProfile(authSession.user.id); if (!profile) { await signOutAdmin(); setUser(null); return; } setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role }); } catch { setUser(null); } finally { setLoading(false); } }, []);
 useEffect(() => { let live = true; getAdminSession().then(session => live && resolve(session)).catch(() => live && (setUser(null), setLoading(false))); const { data: { subscription } } = listenAdminAuth((_event, session) => { if (live) queueMicrotask(() => live && resolve(session)); }); return () => { live = false; subscription.unsubscribe(); }; }, [resolve]);
 const login = useCallback(async (id, password) => { const result = await signInAdmin(id, password); setUser(result.user); return result.user; }, []);
 const logout = useCallback(async () => { await signOutAdmin(); setUser(null); }, []);
 const value = useMemo(() => ({ user, session: user, loading, login, logout, isAuthenticated: Boolean(user), isSuperAdmin: user?.role === 'super_admin' }), [user, loading, login, logout]);
 return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth() { const value = useContext(AdminAuthContext); if (!value) throw new Error('useAdminAuth must be inside AdminAuthProvider.'); return value; }

