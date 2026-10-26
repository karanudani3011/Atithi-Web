import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

// Keep client creation safe at import time; fail with a helpful message at request time.
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;
export const supabase = createClient(
  url || 'https://missing.supabase.co',
  anonKey || 'missing-anon-key'
);

export function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart Vite.'
    );
  }
}
