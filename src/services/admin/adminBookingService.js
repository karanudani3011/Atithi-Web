import { adminSupabase as db, ensureAdminSupabase, friendlyAdminError as friendly } from '../../lib/adminSupabase.js';

export async function listBookings({ search = '', bookingStatus = '', paymentStatus = '', source = '', from = '', to = '', page = 0, pageSize = 20 } = {}) {
  ensureAdminSupabase();
  let query = db.from('bookings').select('*, rooms(room_name, room_type)', { count: 'exact' }).order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
  if (bookingStatus) query = query.eq('booking_status', bookingStatus);
  if (paymentStatus) query = query.eq('payment_status', paymentStatus);
  if (source) query = query.eq('source', source);
  if (from) query = query.gte('check_in', from);
  if (to) query = query.lte('check_in', to);
  if (search) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search);
    query = uuid ? query.eq('id', search) : query.or(`guest_name.ilike.%${search}%,guest_phone.ilike.%${search}%,guest_email.ilike.%${search}%,source.ilike.%${search}%,external_ref.ilike.%${search}%`);
  }
  const { data, error, count } = await query;
  if (error) throw friendly(error, 'Could not load bookings.');
  return { data: data || [], count: count || 0 };
}

export async function getPendingBookingCount() {
  ensureAdminSupabase();
  const { count, error } = await db.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending');
  if (error) throw friendly(error, 'Could not load pending bookings.');
  return count || 0;
}

export async function listConflictingPendingBookings(booking) {
  ensureAdminSupabase();
  if (!booking?.room_id) return [];
  const { data, error } = await db.from('bookings')
    .select('id, guest_name, guest_email, check_in, check_out')
    .eq('room_id', booking.room_id)
    .eq('booking_status', 'pending')
    .lt('check_in', booking.check_out)
    .gt('check_out', booking.check_in)
    .neq('id', booking.id);
  if (error) throw friendly(error, 'Could not check pending requests for this room.');
  return data || [];
}

export async function updateBookingStatus(id, status, rejectConflictingPending = false) {
  ensureAdminSupabase();
  const { data, error } = await db.rpc('admin_set_booking_status', {
    p_booking_id: id,
    p_status: status,
    p_reject_conflicting_pending: rejectConflictingPending,
  });
  if (error) throw friendly(error, 'Could not update this booking status.');
  return Array.isArray(data) ? data[0] : data;
}

export async function updateBooking(id, changes) {
  ensureAdminSupabase();
  const { data, error } = await db.from('bookings').update(changes).eq('id', id).select('*, rooms(room_name, room_type)').single();
  if (error) throw friendly(error, 'Could not update this booking.');
  return data;
}

export async function deleteBooking(id) {
  ensureAdminSupabase();
  const { error } = await db.from('bookings').delete().eq('id', id);
  if (error) throw friendly(error, 'Could not delete this booking.');
}

export async function signedGuestDoc(path) {
  if (!path) return null;
  ensureAdminSupabase();
  const { data, error } = await db.storage.from('guest-docs').createSignedUrl(path, 60);
  if (error) throw friendly(error, 'Could not open this guest document.');
  return data.signedUrl;
}
