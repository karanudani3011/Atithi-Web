import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authenticateAdmin, getAdminProfile, getCurrentAuthSession, onAdminAuthChange, signOutAdmin } from '../services/adminAuthService.js';

const AdminAuthContext = createContext(null);
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(true);
  const authEpoch = useRef(0);
  const loadProfile = useCallback(async (authSession) => {
    const epoch=++authEpoch.current;
    if (!authSession?.user) { setSession(null); setLoading(false); return; }
    let data;try{data=await getAdminProfile(authSession.user.id)}catch{data=null}
    if(epoch!==authEpoch.current)return;
    if (!data) { setSession(null); setLoading(false); return; }
    setSession({ ...data, authSession }); setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    getCurrentAuthSession().then(authSession => { if (active) loadProfile(authSession); }).catch(()=>{if(active){setSession(null);setLoading(false)}});
    const { data: listener } = onAdminAuthChange((_event, authSession) => { if (active) queueMicrotask(() => loadProfile(authSession)); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);
  const login = useCallback(async (id, password) => { const result = await authenticateAdmin(id, password); setSession({ ...result.profile, authSession: result.session }); return result.profile; }, []);
  const logout = useCallback(async () => { await signOutAdmin(); setSession(null); }, []);
  const value = useMemo(() => ({ session, loading, login, logout, isAuthenticated: Boolean(session), isSuperAdmin: session?.role === 'super_admin' }), [session, loading, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth() { const context = useContext(AdminAuthContext); if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider'); return context; }
