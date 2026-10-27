import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authenticateGuest } from '../services/authService.js';
import { signInAdmin, getAdminProfile } from '../services/admin/adminAuthService.js';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'atithi-auth-state';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session) => {
    if (!session?.user) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setLoading(false);
      return;
    }
    const authUser = session.user;
    let profile = null;
    try { profile = await getAdminProfile(authUser.id); } catch { /* A normal guest has no admin profile. */ }
    const role = profile?.role === 'admin' && profile.is_active !== false
      || authUser.app_metadata?.role === 'admin' ? 'admin' : 'user';
    const nextUser = {
      email: authUser.email,
      role,
      isLoggedIn: true,
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const apply = async (session) => { if (active) await applySession(session); };
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) { localStorage.removeItem(STORAGE_KEY); setUser(null); setLoading(false); return; }
      void apply(data.session);
    }).catch(() => { if (active) { localStorage.removeItem(STORAGE_KEY); setUser(null); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => { void apply(session); });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [applySession]);

  const login = useCallback(async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    try {
      const result = await signInAdmin(normalizedEmail, password);
      if (result.user.role !== 'admin') {
        await supabase.auth.signOut();
        return { success: false, role: null, message: 'You do not have access to the admin panel.' };
      }
      const nextUser = { ...result.user, isLoggedIn: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      setLoading(false);
      return { success: true, role: 'admin', message: '' };
    } catch (adminFailure) {
      if (adminFailure?.code === 'admin_profile_check_failed') {
        return { success: false, role: null, message: adminFailure.message };
      }
    }
    try {
      const result = await authenticateGuest({ email: normalizedEmail, password });
      const nextUser = {
        email: result.user?.email || normalizedEmail,
        role: 'user',
        isLoggedIn: true,
        id: result.user?.id,
        name: result.user?.user_metadata?.full_name || result.user?.user_metadata?.name || normalizedEmail,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      setLoading(false);
      return { success: true, role: 'user', message: '' };
    } catch (error) {
      return { success: false, role: null, message: error?.message || 'Invalid email or password.' };
    }
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}




