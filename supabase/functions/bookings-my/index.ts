import { adminClient, cookieToken, currentUser, enforceRateLimit, json, options, sha256, localToday, shiftDate } from '../_shared_bookings.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'GET') return json(req, { error: 'Method not allowed.' }, 405);
  if (!await enforceRateLimit(req, 'bookings-my', 60)) return json(req, { error: 'Too many requests. Please try again shortly.' }, 429);
  const { user, invalid } = await currentUser(req);
  if (invalid) return json(req, { error: 'Please sign in again.' }, 401);
  const token = cookieToken(req);
  if (!user && !token) return json(req, { bookings: [], isGuest: true });
  const db = adminClient();
  if (user && token) {
    const { error } = await db.from('bookings').update({ user_id: user.id }).eq('guest_token_hash', await sha256(token));
    if (error) return json(req, { error: 'Your bookings could not be linked to this account.' }, 503);
  }
  if (user?.email && (user.email_confirmed_at || user.confirmed_at)) {
    const { error } = await db.from('bookings').update({ user_id: user.id }).is('user_id', null).eq('guest_email', user.email.toLowerCase());
    if (error) return json(req, { error: 'Your bookings could not be linked to this account.' }, 503);
  }
  const select = 'booking_ref,check_in,check_out,adults,children,total_amount,payment_status,booking_status,created_at,rooms(room_name,room_type)';
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db.from('bookings').select(select);
    query = user ? query.eq('user_id', user.id) : query.eq('guest_token_hash', await sha256(token));
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + 999);
    if (error) return json(req, { error: 'Your bookings could not load.' }, 503);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const today = localToday(), cutoff = shiftDate(today, 1);
  const bookings = rows.map(row => ({
    booking_ref: row.booking_ref, room_name: row.rooms?.room_name || 'Atithi room', room_type: row.rooms?.room_type || null,
    check_in: row.check_in, check_out: row.check_out, adults: row.adults, children: row.children,
    total_amount: row.total_amount, payment_status: row.payment_status, booking_status: row.booking_status, created_at: row.created_at,
    display_status: ['cancelled', 'rejected'].includes(row.booking_status) ? 'Cancelled'
      : row.booking_status === 'checked_out' || row.check_out < today ? 'Completed' : 'Upcoming',
    cancellation_allowed: ['pending', 'confirmed'].includes(row.booking_status) && row.check_in > cutoff,
  }));
  return json(req, { bookings, isGuest: !user });
});
