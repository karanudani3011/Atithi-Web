import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url || 'https://missing.supabase.co', anonKey || 'missing-anon-key');
export const isSupabaseConfigured = Boolean(url && anonKey);
export function ensureSupabaseConfigured() { if (!url || !anonKey) throw new Error('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart Vite.'); }
