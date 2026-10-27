import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

export async function authenticateGuest({ name, email, password, register = false }) {
  ensureSupabaseConfigured();
  const fullName = name?.trim() || '';
  const normalizedEmail = String(email ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
  const result = register
    ? await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { full_name: fullName } } })
    : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (result.error) {
    if (register) {
      // Keep provider diagnostics visible while signup failures are being investigated.
      console.error('[signup] Supabase Auth rejected the request:', {
        status: result.error.status,
        code: result.error.code,
        message: result.error.message,
        error: result.error,
      });
    }
    throw result.error;
  }
  if (result.data.session?.access_token) {
    try {
      await fetch('/api/bookings/merge', {
        method: 'POST', credentials: 'include',
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${result.data.session.access_token}` },
      });
    } catch { /* Keep sign-in successful if guest-history linking is temporarily unavailable. */ }
  }
  if (!register && result.data.session) {
    try { await supabase.rpc('record_guest_login'); } catch { /* Sign-in remains successful if the activity stamp is unavailable. */ }
  }
  return result.data;
}
