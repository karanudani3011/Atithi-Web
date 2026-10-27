import { supabase } from './supabaseClient.js';

// Login activity is best-effort; callers should never wait for this write.
export async function logLogin(user, client = supabase) {
  if (!user?.id || !user?.email) return;

  try {
    const { error } = await client.from('login_logs').insert({
      user_id: user.id,
      email: user.email,
    });
    if (error) console.error('[login log] Could not record login:', error);
  } catch (error) {
    console.error('[login log] Could not record login:', error);
  }
}
