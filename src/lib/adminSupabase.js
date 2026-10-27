import { supabase, ensureSupabaseConfigured, isSupabaseConfigured } from './supabaseClient.js';

// Admin queries use the same authenticated client and JWT as the shared login.
export const adminSupabase = supabase;
export const isAdminSupabaseConfigured = isSupabaseConfigured;
export const ensureAdminSupabase = ensureSupabaseConfigured;

export function friendlyAdminError(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.message || '';
  if (/duplicate key|already registered|already exists/i.test(message)) return new Error('That email or record already exists.');
  if (/JWT|token|auth/i.test(message)) return new Error('Your admin session may have expired. Please sign in again.');
  if (/network|fetch/i.test(message)) return new Error('Could not reach Supabase. Check your connection and try again.');
  return new Error(message || fallback);
}
