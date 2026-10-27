import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigin = Deno.env.get('WEB_ORIGIN') || '';
export function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': origin === configuredOrigin || localOrigin ? origin : configuredOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}
export function json(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders } });
}
export function options(req: Request) { return new Response('ok', { headers: corsHeaders(req) }); }
export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
}
export async function currentUser(req: Request) {
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { user: null, invalid: false };
  const verifier = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data: { user }, error } = await verifier.auth.getUser(token);
  return { user: error ? null : user, invalid: Boolean(error || !user) };
}
export function cookieToken(req: Request) {
  const raw = req.headers.get('Cookie') || '';
  const token = raw.split(';').map(part => part.trim()).find(part => part.startsWith('atithi_guest='))?.slice('atithi_guest='.length) || '';
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}
export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function enforceRateLimit(req: Request, bucket: string, max: number) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = await sha256(`${bucket}:${ip}`);
  const { data, error } = await adminClient().rpc('consume_api_rate_limit', { p_key: key, p_max: max });
  return !error && data === true;
}
export async function readJson(req: Request, maxBytes = 8192) {
  const raw = await req.text();
  if (raw.length > maxBytes) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}
export function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function localToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
