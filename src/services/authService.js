import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

export async function authenticateGuest({ name, email, password, register = false }) {
  ensureSupabaseConfigured();
  const result = register
    ? await supabase.auth.signUp({ email, password, options: { data: { name: name?.trim() || '' } } })
    : await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw new Error(result.error.message);
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
