import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';

const fallbackMessage = 'Something went wrong. Please check your connection and try again.';

function throwRpcError(error) {
  if (!error) return;
  console.error('[access management] request failed', error);
  const message = error.message || '';
  if (/failed to fetch|network|load failed|fetch error/i.test(message)) throw new Error(fallbackMessage);
  throw new Error(message || fallbackMessage);
}

export async function listTeamMembers() {
  ensureAdminSupabase();
  const { data, error } = await db.from('admin_profiles')
    .select('id,name,email,role,is_active,created_at')
    .order('created_at', { ascending: false });
  throwRpcError(error);
  return data || [];
}

export async function createTeamMember(payload) {
  ensureAdminSupabase();
  const { data, error } = await db.rpc('admin_create_team_member', {
    p_name: payload.name,
    p_email: payload.email,
    p_password: payload.password,
    p_role: payload.role,
  });
  throwRpcError(error);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function updateTeamMember(id, changes) {
  ensureAdminSupabase();
  const params = { p_id: id };
  if (Object.hasOwn(changes, 'role')) params.p_role = changes.role;
  if (Object.hasOwn(changes, 'is_active')) params.p_is_active = changes.is_active;
  const { error } = await db.rpc('admin_update_team_member', params);
  throwRpcError(error);
}

export async function removeTeamMember(id) {
  ensureAdminSupabase();
  const { data, error } = await db.rpc('admin_remove_team_member', { p_id: id });
  throwRpcError(error);
  if (data?.error) throw new Error(data.error);
  return data;
}
