import { adminClient, cookieToken, currentUser, enforceRateLimit, json, options, readJson, sha256, validEmail } from '../_shared_bookings.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);
  if (!await enforceRateLimit(req, 'booking-create', 10)) return json(req, { error: 'Too many booking attempts. Please try again in 15 minutes.' }, 429);
  const body = await readJson(req);
  if (!body) return json(req, { error: 'Invalid request.' }, 400);
  const { user, invalid } = await currentUser(req);
  if (invalid) return json(req, { error: 'Please sign in again to continue.' }, 401);
  const name = typeof body.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const roomId = typeof body.roomId === 'string' ? body.roomId : '';
  const checkIn = typeof body.checkIn === 'string' ? body.checkIn : '';
  const checkOut = typeof body.checkOut === 'string' ? body.checkOut : '';
  const adults = Number(body.adults), children = Number(body.children);
  const notes = typeof body.specialRequests === 'string' ? body.specialRequests.trim().slice(0, 1000) : '';
  if (!name || name.length > 100 || !validEmail(email) || !/^\d{10}$/.test(phone) || !uuidPattern.test(roomId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) ||
      !Number.isInteger(adults) || adults < 1 || adults > 20 || !Number.isInteger(children) || children < 0 || children > 20) {
    return json(req, { error: 'Please check your name, contact details, dates, and guest count.' }, 400);
  }

  let guestToken = '';
  if (!user) {
    guestToken = cookieToken(req);
    if (!guestToken) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      guestToken = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
  }
  const guestTokenHash = guestToken ? await sha256(guestToken) : null;
  const db = adminClient();
  const { data, error } = await db.rpc('create_booking', {
    p_room_id: roomId, p_check_in: checkIn, p_check_out: checkOut, p_adults: adults, p_children: children,
    p_name: name, p_email: email, p_phone: phone, p_notes: notes || null,
    p_guest_token_hash: guestTokenHash, p_user_id: user?.id || null,
  });
  if (error) return json(req, { error: error.message || 'We could not complete this booking.' }, 400);
  const booking = Array.isArray(data) ? data[0] : data;
  if (!booking?.booking_ref) return json(req, { error: 'Booking could not be confirmed.' }, 500);
  const secure = Deno.env.get('APP_ENV') === 'production' ? '; Secure' : '';
  const cookie = guestToken ? `atithi_guest=${guestToken}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}` : '';
  return json(req, { booking: { booking_ref: booking.booking_ref, total_amount: booking.total_amount, nights: booking.nights } }, 201,
    cookie ? { 'Set-Cookie': cookie } : {});
});

