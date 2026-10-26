import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

export async function authenticateGuest({ name, email, password, register = false }) {
  ensureSupabaseConfigured();
  const result = register
    ? await supabase.auth.signUp({ email, password, options: { data: { name: name?.trim() || '' } } })
    : await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw new Error(result.error.message);
  if (!register && result.data.session) {
    try { await supabase.rpc('record_guest_login'); } catch { /* Sign-in remains successful if the activity stamp is unavailable. */ }
  }
  return result.data;
}
