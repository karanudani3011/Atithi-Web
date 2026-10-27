import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

const messages = [
  [/PGRST202|create_public_booking/i, 'Booking setup is incomplete. Please run the public booking SQL migration.'],
  [/fetch failed|failed to fetch|network request failed/i, 'Could not connect to the booking service. Please try again shortly.'],
  [/ROOM_NOT_AVAILABLE|no longer available|not currently available/i, 'This room is not available for those dates. Please choose another room or dates.'],
  [/INVALID_DATES|check-in|check-out|date/i, 'Please choose valid dates. Check-in must be today or later, and check-out must be after check-in.'],
  [/TOO_MANY_GUESTS|INVALID_GUEST_COUNT|capacity|guest count/i, 'The number of guests is over this room’s capacity. Please adjust the guest count.'],
  [/INVALID_NAME/i, 'Please enter your name.'],
  [/INVALID_EMAIL|valid email/i, 'Please enter a valid email address.'],
  [/INVALID_PHONE|10 digit phone|mobile/i, 'Please enter a valid 10-digit mobile number.'],
  [/INVALID_USER/i, 'Please sign in again before booking.'],
];

function friendlyBookingError(error) {
  const source = String(error?.message || error || '');
  const friendly = messages.find(([pattern]) => pattern.test(source))?.[1]
    || 'We could not complete this booking. Please try again.';
  return new Error(friendly, { cause: error });
}

export async function createBooking(form) {
  ensureSupabaseConfigured();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('[booking] could not read Supabase session', sessionError);
    throw friendlyBookingError(sessionError);
  }

  const user = session?.user;
  const params = {
    p_room_id: form.roomId,
    p_check_in: form.checkIn,
    p_check_out: form.checkOut,
    p_adults: Number(form.adults),
    p_children: Number(form.children),
    p_guest_name: String(form.fullName || '').trim(),
    p_guest_email: String(form.email || '').trim().toLowerCase(),
    p_guest_phone: String(form.phone || '').replace(/\D/g, ''),
    p_special_requests: String(form.requests || '').trim() || null,
    p_firebase_uid: form.firebase_uid || user?.user_metadata?.firebase_uid || null,
    p_user_id: user?.id || null,
  };

  const { data, error } = await supabase.rpc('create_public_booking', params);
  if (error) {
    console.error('[booking] create_public_booking RPC failed', {
      code: error.code, message: error.message, details: error.details,
      hint: error.hint, error,
    });
    throw friendlyBookingError(error);
  }

  const booking = Array.isArray(data) ? data[0] : data;
  if (!booking?.booking_ref || !booking?.id) {
    const error = new Error('Booking reference was not returned by the booking RPC.');
    console.error('[booking] unexpected RPC response', { data, error });
    throw friendlyBookingError(error);
  }
  return { ...booking, total: booking.total_amount };
}

export async function getBookedRanges(roomId, from, to) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc('get_room_booked_ranges', { p_room_id: roomId, p_from: from, p_to: to });
  if (error) {
    console.error('[booking] booked-date request failed', { message: error.message, details: error.details, hint: error.hint, code: error.code, error });
    throw friendlyBookingError(error);
  }
  return Array.isArray(data) ? data : [];
}
