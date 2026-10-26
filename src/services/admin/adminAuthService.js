import { adminSupabase as db, ensureAdminSupabase, friendlyAdminError as friendly } from '../../lib/adminSupabase.js';
async function invoke(name, body) { const { data, error } = await db.functions.invoke(name, { body }); if (error) { let detail; try { detail = await error.context?.json(); } catch {} throw new Error(detail?.error || error.message || 'The admin request failed.'); } if (data?.error) throw new Error(data.error); return data; }
export async function signInAdmin(id, password) {
  ensureAdminSupabase();
  const entered = String(id || '').trim();
  const email = entered.includes('@') ? entered : entered.toLowerCase() === 'admin' ? 'admin@atithi.com' : entered;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(/invalid login credentials/i.test(error.message) ? 'The ID or password you entered is incorrect.' : friendly(error, 'Could not sign in.'));

  const { data: profile, error: profileError } = await db
    .from('admin_profiles')
    .select('id,name,email,role,created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    await db.auth.signOut();
    throw friendly(profileError, 'Could not verify the admin profile.');
  }
  if (!profile) {
    await db.auth.signOut();
    throw new Error('Access denied. This account is not an Atithi administrator.');
  }
  return { user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role }, session: data.session };
}
export async function getAdminProfile(id) { ensureAdminSupabase(); const { data, error } = await db.from('admin_profiles').select('id,name,email,role,created_at').eq('id', id).maybeSingle(); if (error) throw friendly(error, 'Could not verify the admin profile.'); return data; }
export async function getAdminSession() { ensureAdminSupabase(); const { data, error } = await db.auth.getSession(); if (error) throw friendly(error, 'Could not restore the admin session.'); return data.session; }
export function listenAdminAuth(callback) { return db.auth.onAuthStateChange(callback); }
export async function signOutAdmin() { ensureAdminSupabase(); const { error } = await db.auth.signOut(); if (error) throw friendly(error, 'Could not sign out.'); }
export async function listAdmins() { ensureAdminSupabase(); const { data, error } = await db.from('admin_profiles').select('id,name,email,role,created_at').order('created_at', { ascending: true }); if (error) throw friendly(error, 'Could not load admin users.'); return data || []; }
export async function createAdmin(payload) { ensureAdminSupabase(); return invoke('create-admin', payload); }
export async function updateAdmin(id, payload) { ensureAdminSupabase(); return invoke('update-admin', { id, ...payload }); }
export async function revokeAdmin(id) { ensureAdminSupabase(); return invoke('delete-admin', { id }); }
