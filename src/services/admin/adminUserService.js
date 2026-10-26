import { adminSupabase as db, ensureAdminSupabase, friendlyAdminError as friendly } from '../../lib/adminSupabase.js';
async function edge(name, body) { const { data, error } = await db.functions.invoke(name, { body }); if (error) { let value; try { value = await error.context?.json(); } catch {} throw new Error(value?.error || error.message); } if (data?.error) throw new Error(data.error); return data; }
export async function getAdmins() { ensureAdminSupabase(); const { data,error }=await db.from('admin_profiles').select('id,name,email,role,created_at').order('created_at',{ascending:true});if(error)throw friendly(error,'Could not load admin users.');return data||[]; }
export async function createAdminUser(payload) { ensureAdminSupabase(); return edge('create-admin',payload); }
export async function updateAdminUser(id,payload) { ensureAdminSupabase(); return edge('update-admin',{id,...payload}); }
export async function revokeAdminUser(id) { ensureAdminSupabase(); return edge('delete-admin',{id}); }
