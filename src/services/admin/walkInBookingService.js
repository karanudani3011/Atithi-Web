import { adminSupabase as db, ensureAdminSupabase, friendlyAdminError as friendly } from '../../lib/adminSupabase.js';

const reservingStatuses = ['pending', 'confirmed', 'checked_in'];

export async function listWalkInAvailableRooms({ roomTypeId, roomTypeName, checkIn, checkOut }) {
  ensureAdminSupabase();
  if (!roomTypeId || !checkIn || !checkOut || checkOut <= checkIn) return [];

  const [roomsResult, bookingsResult] = await Promise.all([
    db.from('rooms')
      .select('id,room_name,room_type,room_type_id,price_per_night,capacity,status,units_left,total_units,property_id')
      .eq('status', 'available')
      .order('room_name', { ascending: true }),
    db.from('bookings')
      .select('room_id')
      .in('booking_status', reservingStatuses)
      .lt('check_in', checkOut)
      .gt('check_out', checkIn),
  ]);
  if (roomsResult.error) throw friendly(roomsResult.error, 'Could not load available rooms.');
  if (bookingsResult.error) throw friendly(bookingsResult.error, 'Could not check room availability.');

  const bookedRoomIds = new Set((bookingsResult.data || []).map(({ room_id }) => room_id));
  const normalizedType = String(roomTypeName || '').trim().toLowerCase();
  return (roomsResult.data || []).filter(room => {
    const typeMatches = room.room_type_id
      ? room.room_type_id === roomTypeId
      : String(room.room_type || '').trim().toLowerCase() === normalizedType;
    return typeMatches && !bookedRoomIds.has(room.id) && Number(room.units_left ?? 1) > 0;
  });
}

export async function createWalkInBooking(booking) {
  ensureAdminSupabase();
  const { room_id: roomId, check_in: checkIn, check_out: checkOut } = booking;
  if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) {
    throw new Error('Select a room and valid stay dates before saving.');
  }

  // Recheck immediately before insert. The database exclusion constraint remains the atomic race guard.
  const [roomResult, conflictsResult] = await Promise.all([
    db.from('rooms').select('id,status').eq('id', roomId).maybeSingle(),
    db.from('bookings').select('id').eq('room_id', roomId)
      .in('booking_status', reservingStatuses).lt('check_in', checkOut).gt('check_out', checkIn).limit(1),
  ]);
  if (roomResult.error) throw friendly(roomResult.error, 'Could not recheck room availability.');
  if (!roomResult.data || roomResult.data.status !== 'available') {
    throw new Error('This room is no longer available. Choose another room.');
  }
  const { data: conflicts, error: availabilityError } = conflictsResult;
  if (availabilityError) throw friendly(availabilityError, 'Could not recheck room availability.');
  if (conflicts?.length) throw new Error('This room was just booked for those dates. Choose another room or dates.');

  const { data, error } = await db.from('bookings')
    .insert({ ...booking, source: booking.source || 'walk-in', external_ref: booking.external_ref || null, user_id: null })
    .select('*, rooms(room_name,room_type)')
    .single();
  if (error?.code === '23P01') throw new Error('This room was just booked for those dates. Choose another room or dates.');
  if (error) throw friendly(error, 'Could not create the walk-in booking.');
  return data;
}
