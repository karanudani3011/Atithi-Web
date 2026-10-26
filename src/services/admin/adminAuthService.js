import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';

export async function signInAdmin(id, password) {
  ensureAdminSupabase();
  const email = String(id || '').trim().toLowerCase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    try { await db.auth.signOut(); } catch { /* Clear any stale session after a failed login. */ }
    throw new Error('Email/password check karo ane fari try karo.');
  }

  const deny = async () => {
    try { await db.auth.signOut(); } catch { /* Keep the access-denied state visible. */ }
    throw new Error('Access denied: aa active admin/staff account nathi.');
  };

  let result;
  try {
    result = await db.from('admin_profiles').select('id,name,email,role,is_active')
      .eq('id', data.user.id).maybeSingle();
  } catch { return deny(); }
  if (result?.error || !['admin', 'staff'].includes(result?.data?.role) || result?.data?.is_active !== true) return deny();
  return {
    user: { id: result.data.id, name: result.data.name, email: result.data.email, role: result.data.role },
    session: data.session,
  };
}

export async function getAdminProfile(id) {
  ensureAdminSupabase();
  const { data, error } = await db.from('admin_profiles').select('id,name,email,role,is_active').eq('id', id).maybeSingle();
  if (error) return null;
  return ['admin', 'staff'].includes(data?.role) && data?.is_active === true ? data : null;
}
export async function getAdminSession() {
  ensureAdminSupabase();
  const { data, error } = await db.auth.getSession();
  if (error) throw new Error('Session restore na thayu. Please sign in again.');
  return data.session;
}
export function listenAdminAuth(callback) { return db.auth.onAuthStateChange(callback); }
export async function signOutAdmin() { ensureAdminSupabase(); await db.auth.signOut(); }

