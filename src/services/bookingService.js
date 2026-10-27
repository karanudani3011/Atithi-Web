import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { getAvailableRoomIds } from './roomService.js';

const friendly = (error, fallback) => new Error(error?.message || fallback);

export async function createBooking(form) {
  ensureSupabaseConfigured();
  try {
    // Fast client-side check for a clear message; the RPC independently checks overlap.
    const availableIds = await getAvailableRoomIds(form.checkIn, form.checkOut);
    if (!availableIds.includes(String(form.roomId))) {
      throw new Error('Aa dates par room available nathi. Biji dates ke room select karo.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/bookings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({
        roomId: form.roomId, checkIn: form.checkIn, checkOut: form.checkOut,
        adults: Number(form.adults), children: Number(form.children),
        fullName: form.fullName.trim(), email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ''), specialRequests: form.requests?.trim() || '',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'We could not complete this booking. Please try again.');
    const result = payload.booking;
    if (!result?.booking_ref) throw new Error('Booking reference was not returned. Please contact Atithi support.');
    // TODO: invoke send-booking-confirmation after the email provider is configured.
    return { ...result, total: result.total_amount };
  } catch (error) {
    throw friendly(error, 'We could not complete this booking. Please check your details and try again.');
  }
}

export async function getBookedRanges(roomId) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc('get_booked_ranges', { p_room_id: roomId });
  if (error) throw friendly(error, 'Could not check room availability.');
  return Array.isArray(data) ? data : data?.booked_ranges || data?.ranges || [];
}
