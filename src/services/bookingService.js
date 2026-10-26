import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

const friendly = (error, fallback) => new Error(error?.message || fallback);
const uploadGuestFile = async (file) => { if (!file) return null; const path = `guests/${crypto.randomUUID()}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`; const { error } = await supabase.storage.from('guest-docs').upload(path, file, { contentType: file.type, upsert: false }); if (error) throw friendly(error, 'Could not upload the guest document.'); return path; };
export async function createBooking(form) {
  ensureSupabaseConfigured();
  let photoPath, idPath;
  try {
    photoPath = await uploadGuestFile(form.photo);
    idPath = await uploadGuestFile(form.idProof);
    const { data, error } = await supabase.rpc('create_booking', { p_room_id: form.roomId, p_full_name: form.fullName.trim(), p_phone: form.phone.replace(/\D/g, ''), p_email: form.email.trim(), p_adults: Number(form.adults), p_children: Number(form.children), p_check_in: form.checkIn, p_check_out: form.checkOut, p_requests: form.requests?.trim() || '', p_photo_path: photoPath, p_id_type: form.idProofType, p_id_path: idPath });
    if (error) throw error;
    const result=Array.isArray(data)?data[0]:data;
    if(!result?.booking_code)throw new Error('The server did not return a booking confirmation. Please contact Atithi support before trying again.');
    return result;
  } catch (error) { throw friendly(error, 'We could not complete this booking. Please check your details and try again.'); }
}
export async function getBookedRanges(roomId) { ensureSupabaseConfigured(); const { data, error } = await supabase.rpc('get_booked_ranges', { p_room_id: roomId }); if (error) throw friendly(error, 'Could not check room availability.'); return Array.isArray(data)?data:data?.booked_ranges||data?.ranges||[]; }
export async function getAllBookings() { ensureSupabaseConfigured(); const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }); if (error) throw friendly(error, 'Could not load bookings.'); return data || []; }
export async function cancelBooking(id) { ensureSupabaseConfigured(); const { data, error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id).select().single(); if (error) throw friendly(error, 'Could not cancel this booking.'); return data; }
export async function deleteBooking(id) { ensureSupabaseConfigured(); const { error } = await supabase.from('bookings').delete().eq('id', id); if (error) throw friendly(error, 'Could not delete this booking.'); return true; }
export async function getSignedDocUrl(path) { if (!path) return null; ensureSupabaseConfigured(); const { data, error } = await supabase.storage.from('guest-docs').createSignedUrl(path, 60); if (error) throw friendly(error, 'Could not open this document.'); return data.signedUrl; }
export function subscribeToBookings(onInsert) { const channel = supabase.channel('admin-bookings-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, payload => onInsert(payload.new)).subscribe(); return () => supabase.removeChannel(channel); }
