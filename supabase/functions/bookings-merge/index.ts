import { adminClient, cookieToken, currentUser, enforceRateLimit, json, options, sha256 } from '../_shared_bookings.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);
  if (!await enforceRateLimit(req, 'bookings-merge', 20)) return json(req, { error: 'Too many requests. Please try again shortly.' }, 429);
  const { user, invalid } = await currentUser(req);
  if (invalid || !user) return json(req, { error: 'Authentication required.' }, 401);
  const db = adminClient();
  const token = cookieToken(req);
  let linked = 0;
  if (token) {
    const { data, error } = await db.from('bookings').update({ user_id: user.id }).eq('guest_token_hash', await sha256(token)).select('booking_ref');
    if (error) return json(req, { error: 'Guest booking history could not be linked.' }, 503);
    linked += data?.length || 0;
  }
  const verifiedEmail = Boolean(user.email && (user.email_confirmed_at || user.confirmed_at));
  if (verifiedEmail) {
    const { data, error } = await db.from('bookings').update({ user_id: user.id }).is('user_id', null).eq('guest_email', user.email!.toLowerCase()).select('booking_ref');
    if (error) return json(req, { error: 'Guest booking history could not be linked.' }, 503);
    linked += data?.length || 0;
  }
  return json(req, { linked });
});
