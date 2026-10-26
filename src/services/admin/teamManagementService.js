import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';

const explain = (error, fallback) => {
  const message = error?.message || '';
  if (/last active admin/i.test(message)) return new Error('Last active admin ne disable, demote ke remove nahi kari shakai.');
  if (/duplicate key|already exists|unique/i.test(message)) return new Error('Aa email team ma pehlethi use thay che.');
  return new Error(fallback);
};

export async function listTeamMembers() {
  ensureAdminSupabase();
  const { data, error } = await db.from('admin_profiles')
    .select('id,name,email,role,is_active,created_at,created_by')
    .order('created_at', { ascending: false });
  if (error) throw explain(error, 'Team list load na thai. Retry karo.');
  return data || [];
}

export async function createTeamMember(payload) {
  ensureAdminSupabase();
  const { data, error } = await db.functions.invoke('create-team-member', { body: payload });
  if (error) {
    let detail;
    try { detail = await error.context?.json(); } catch { /* Use the friendly fallback below. */ }
    throw new Error(detail?.error || 'Access create na thayu. Please try again.');
  }
  if (data?.error) throw new Error(data.error);
  return data?.data;
}

export async function updateTeamMember(id, changes) {
  ensureAdminSupabase();
  const { error } = await db.from('admin_profiles').update(changes).eq('id', id);
  if (error) throw explain(error, 'Team member update na thayu. Please try again.');
}

export async function removeTeamMember(id) {
  ensureAdminSupabase();
  const { data, error } = await db.functions.invoke('remove-team-member', { body: { id } });
  if (error) {
    let detail;
    try { detail = await error.context?.json(); } catch { /* Use the friendly fallback below. */ }
    throw new Error(detail?.error || 'Access remove na thayu. Please try again.');
  }
  if (data?.error) throw new Error(data.error);
}
