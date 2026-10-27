import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';
const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

async function request(path, { method = 'GET', body } = {}) {
  ensureAdminSupabase();
  const { data: { session } } = await db.auth.getSession();
  if (!session?.access_token) throw new Error('Your admin session has expired. Please sign in again.');
  const response = await fetch(`${baseUrl}/functions/v1/${path}`, {
    method,
    headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let result;
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) throw new Error(result?.error || 'Could not complete the request. Please try again.');
  return result;
}

export async function listAccessHolders() { return request('admin-access'); }
export async function createAccessHolder(payload) { return request('admin-access', { method: 'POST', body: payload }); }
export async function updateAccessHolder(id, payload) { return request(`admin-access/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }); }
export async function revokeAccess(id) { return updateAccessHolder(id, { is_active: false }); }
