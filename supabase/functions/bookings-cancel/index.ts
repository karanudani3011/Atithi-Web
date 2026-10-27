import { adminClient, cookieToken, currentUser, enforceRateLimit, json, options, readJson, sha256, localToday, shiftDate } from '../_shared_bookings.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);
  if (!await enforceRateLimit(req, 'bookings-cancel', 20)) return json(req, { error: 'Too many requests. Please try again shortly.' }, 429);
  const body = await readJson(req, 1024);
  const bookingRef = typeof body?.bookingRef === 'string' ? body.bookingRef.trim().toUpperCase() : '';
  if (!/^ATH-[0-9]{8}-[A-Z0-9]{4,8}$/.test(bookingRef)) return json(req, { error: 'Invalid booking reference.' }, 400);
  const { user, invalid } = await currentUser(req);
  if (invalid) return json(req, { error: 'Please sign in again.' }, 401);
  const token = cookieToken(req), tokenHash = token ? await sha256(token) : '';
  const db = adminClient();
  const { data: row, error: lookupError } = await db.from('bookings')
    .select('id,user_id,guest_token_hash,booking_status,check_in').eq('booking_ref', bookingRef).maybeSingle();
  if (lookupError) return json(req, { error: 'Booking could not be cancelled right now.' }, 503);
  const owned = Boolean(row && ((user && row.user_id === user.id) || (tokenHash && row.guest_token_hash === tokenHash)));
  if (!owned) return json(req, { error: 'Booking not found.' }, 404);
  const cutoff = shiftDate(localToday(), 1);
  if (!['pending', 'confirmed'].includes(row.booking_status) || row.check_in <= cutoff) return json(req, { error: 'This booking is no longer eligible for cancellation.' }, 409);
  const { error } = await db.from('bookings').update({ booking_status: 'cancelled' }).eq('id', row.id);
  if (error) return json(req, { error: 'Booking could not be cancelled right now.' }, 503);
  return json(req, { cancelled: true, bookingRef });
});
