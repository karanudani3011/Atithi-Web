import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const adminSupabase = createClient(url || 'https://missing.supabase.co', anonKey || 'missing-anon-key', { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'atithi-admin-auth' } });
export function ensureAdminSupabase() { if (!url || !anonKey) throw new Error('Admin Supabase is not configured. Check the public Supabase URL and anon key in .env.'); }
export function friendlyAdminError(error, fallback = 'Something went wrong. Please try again.') { const message = error?.message || ''; if (/duplicate key|already registered|already exists/i.test(message)) return new Error('That email or record already exists.'); if (/JWT|token|auth/i.test(message)) return new Error('Your admin session may have expired. Please sign in again.'); if (/network|fetch/i.test(message)) return new Error('Could not reach Supabase. Check your connection and try again.'); return new Error(message || fallback); }
