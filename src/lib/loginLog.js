import { supabase } from './supabaseClient.js';

const SESSION_FLAG_PREFIX = 'atithi-login-history';
const seenSessions = new Set();

function sessionMarker(session) {
  try {
    let encoded = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    encoded += '='.repeat((4 - (encoded.length % 4)) % 4);
    const payload = JSON.parse(window.atob(encoded));
    return payload.session_id || payload.iat || 'current';
  } catch {
    return 'current';
  }
}

export function clearLoginHistoryDedupe() {
  seenSessions.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(`${SESSION_FLAG_PREFIX}:`)) sessionStorage.removeItem(key);
    }
  } catch { /* Storage may be unavailable in restricted browser contexts. */ }
}

// Called only for Supabase SIGNED_IN events; storage prevents duplicate writes per session.
export async function logLoginHistory(session, client = supabase) {
  const user = session?.user;
  if (!user?.id || !user?.email) return;

  const flag = `${SESSION_FLAG_PREFIX}:${user.id}:${sessionMarker(session)}`;
  if (seenSessions.has(flag)) return;
  seenSessions.add(flag);
  try {
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, 'pending');
  } catch { /* The auth event still logs if session storage is blocked. */ }

  try {
    const [profileResult, adminProfileResult] = await Promise.all([
      client.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle(),
      client.from('admin_profiles').select('name,role').eq('id', user.id).maybeSingle(),
    ]);
    const profile = profileResult.error ? null : profileResult.data;
    const adminProfile = adminProfileResult.error ? null : adminProfileResult.data;
    const { error } = await client.from('login_history').insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || profile?.full_name || adminProfile?.name || user.user_metadata?.name || null,
      email: user.email,
      role: adminProfile?.role || profile?.role || user.app_metadata?.role || 'user',
      user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
    });
    if (error) console.error('[login history] Could not record login:', error);
  } catch (error) {
    console.error('[login history] Could not record login:', error);
  }
}
