import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';
import { logLogin } from '../../lib/loginLog.js';

export async function signInAdmin(id, password) {
  ensureAdminSupabase();
  const email = String(id || '').trim().toLowerCase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    try { await db.auth.signOut(); } catch { /* Clear any stale session after a failed login. */ }
    if (/failed to fetch|network|load failed/i.test(error.message || '')) {
      throw new Error('Something went wrong. Please check your connection and try again.');
    }
    throw new Error('Invalid email or password.');
  }

  const deny = async (message) => {
    try { await db.auth.signOut(); } catch { /* Keep the access-denied state visible. */ }
    throw new Error(message);
  };

  let result;
  try {
    result = await db.from('admin_profiles').select('id,name,email,role,is_active')
      .eq('id', data.user.id).maybeSingle();
  } catch (profileError) {
    console.error('[admin login] profile lookup failed', profileError);
    return deny('Something went wrong. Please check your connection and try again.');
  }
  if (result?.error) {
    console.error('[admin login] profile lookup failed', result.error);
    return deny('Something went wrong. Please check your connection and try again.');
  }
  if (!result?.data) return deny('You do not have access to the admin panel.');
  if (result.data.is_active !== true) return deny('Your access has been disabled. Please contact an admin.');
  if (!['admin', 'staff'].includes(result.data.role)) return deny('You do not have access to the admin panel.');
  void logLogin(data.user, db);
  return {
    user: { id: result.data.id, name: result.data.name, email: result.data.email, role: result.data.role },
    session: data.session,
  };
}

export async function getAdminProfile(id) {
  ensureAdminSupabase();
  const { data, error } = await db.from('admin_profiles').select('id,name,email,role,is_active').eq('id', id).maybeSingle();
  if (error) return null;
  return data || null;
}
export async function getAdminSession() {
  ensureAdminSupabase();
  const { data, error } = await db.auth.getSession();
  if (error) throw new Error('Your session could not be restored. Please sign in again.');
  return data.session;
}
export function listenAdminAuth(callback) { return db.auth.onAuthStateChange(callback); }
export async function signOutAdmin() { ensureAdminSupabase(); await db.auth.signOut(); }

