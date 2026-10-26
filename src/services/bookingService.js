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
    const { data, error } = await supabase.rpc('create_booking', {
      p_room_id: form.roomId,
      p_check_in: form.checkIn,
      p_check_out: form.checkOut,
      p_adults: Number(form.adults),
      p_children: Number(form.children),
      p_name: form.fullName.trim(),
      p_email: form.email.trim(),
      p_phone: form.phone.replace(/\D/g, ''),
      p_notes: form.requests?.trim() || null,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
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
