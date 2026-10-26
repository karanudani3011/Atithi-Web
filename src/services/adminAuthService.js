import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

const friendly = error => new Error(error?.message || 'Something went wrong. Please try again.');
async function edgeCall(name, body) { const { data, error } = await supabase.functions.invoke(name, { body }); if (error) { let payload; try { payload = await error.context?.json(); } catch {} throw new Error(payload?.error || error.message || 'The admin request failed.'); } if (data?.error) throw new Error(data.error); return data; }
export async function authenticateAdmin(id, password) {
  ensureSupabaseConfigured();
  const email = String(id || '').trim().includes('@') ? String(id).trim() : String(id).trim().toLowerCase() === 'admin' ? 'admin@atithi.com' : String(id).trim();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw friendly(new Error('The ID or password you entered is incorrect. Please try again.'));
  const { data: profile, error: profileError } = await supabase.from('admin_profiles').select('id,name,email,role').eq('id', data.user.id).maybeSingle();
  if (profileError || !profile) { await supabase.auth.signOut(); throw new Error('Access denied. This account is not an Atithi administrator.'); }
  return { user: data.user, session: data.session, profile };
}
export async function getAdminProfile(userId) { ensureSupabaseConfigured(); const { data, error } = await supabase.from('admin_profiles').select('id,name,email,role').eq('id', userId).maybeSingle(); if (error) throw friendly(error); return data; }
export async function getCurrentAuthSession() { const { data, error } = await supabase.auth.getSession(); if (error) throw friendly(error); return data.session; }
export async function getAdminUsers() { ensureSupabaseConfigured(); const { data, error } = await supabase.from('admin_profiles').select('*').eq('role', 'sub_admin'); if (error) throw friendly(error); return (data || []).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)); }
export async function createAdminUser(user) { ensureSupabaseConfigured(); return edgeCall('create-admin', { name: user.name.trim(), email: user.email.trim().toLowerCase(), password: user.password }); }
export async function updateAdminUser(id, changes) { ensureSupabaseConfigured(); const { data, error } = await supabase.from('admin_profiles').update({ name: changes.name.trim() }).eq('id', id).select('*').single(); if (error) throw friendly(error); return data; }
export async function deleteAdminUser(id) { ensureSupabaseConfigured(); await edgeCall('delete-admin', { id }); return true; }
export const onAdminAuthChange = callback => supabase.auth.onAuthStateChange(callback);
export async function signOutAdmin() { const { error } = await supabase.auth.signOut(); if (error) throw friendly(error); }
