import { ensureSupabaseConfigured, isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

// `status` is included so user-side cards can correctly disable unavailable rooms.
export const PUBLIC_ROOM_COLUMNS = 'id, room_name, room_type, description, price_per_night, capacity, amenities, image_urls, badge, bed_info, size_sqft, rating, units_left, status';
const WRITABLE_ROOM_COLUMNS = [
  'property_id', 'room_name', 'room_type', 'description', 'price_per_night',
  'capacity', 'amenities', 'image_urls', 'status', 'is_published', 'badge',
  'bed_info', 'size_sqft', 'rating', 'sort_order', 'units_left',
];

const friendly = (error, fallback) => new Error(error?.message || fallback);
export const formatINR = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
export function normalizeRoom(row) {
  const imageUrls = Array.isArray(row?.image_urls) ? row.image_urls.filter(Boolean)
    : Array.isArray(row?.images) ? row.images.filter(Boolean)
      : [row?.image_url || row?.image].filter(Boolean);
  const rawPrice = row?.price_per_night ?? row?.price;
  const rawSize = row?.size_sqft ?? row?.size;
  const rawCapacity = row?.capacity ?? row?.max_guests ?? row?.maxGuests;
  const rawRating = row?.rating;
  const price = rawPrice == null || rawPrice === '' || !Number.isFinite(Number(rawPrice)) ? null : Number(rawPrice);
  const sizeSqFt = rawSize == null || rawSize === '' || !Number.isFinite(Number(rawSize)) ? null : Number(rawSize);
  const guests = rawCapacity == null || rawCapacity === '' || !Number.isFinite(Number(rawCapacity)) ? null : Number(rawCapacity);
  const rating = rawRating == null || rawRating === '' || !Number.isFinite(Number(rawRating)) ? null : Number(rawRating);
  return {
    ...row,
    name: row?.room_name || row?.name || 'Atithi stay',
    type: row?.room_type || row?.type || 'Stay',
    price,
    sizeSqFt,
    size: sizeSqFt == null ? null : sizeSqFt / 10.7639,
    guests,
    image: imageUrls[0] || '',
    image_urls: imageUrls,
    amenities: Array.isArray(row?.amenities) ? row.amenities : [],
    rating,
  };
}
const toRow = (room) => Object.fromEntries(
  WRITABLE_ROOM_COLUMNS
    .filter((column) => Object.prototype.hasOwnProperty.call(room, column))
    .map((column) => [
      column,
      column === 'amenities' ? (Array.isArray(room[column]) ? room[column] : [])
        : column === 'image_urls' ? (Array.isArray(room[column]) ? room[column].filter(Boolean) : [])
          : room[column],
    ])
);

async function request(query, fallback) {
  ensureSupabaseConfigured();
  const { data, error } = await query;
  if (error) throw friendly(error, fallback);
  return data;
}

export async function getRooms({ limit, ratingFirst = false } = {}) {
  let query = supabase.from('rooms').select(PUBLIC_ROOM_COLUMNS).eq('is_published', true);
  query = ratingFirst
    ? query.order('rating', { ascending: false, nullsFirst: false }).order('sort_order', { ascending: true })
    : query.order('sort_order', { ascending: true });
  if (Number.isInteger(limit) && limit > 0) query = query.limit(limit);
  const rows = await request(query, 'Could not load rooms.');
  return (rows || []).map(normalizeRoom);
}

export async function getRoomById(id) {
  if (!id) return null;
  const row = await request(
    supabase.from('rooms')
      .select(PUBLIC_ROOM_COLUMNS)
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle(),
    'Could not load this room.'
  );
  return row ? normalizeRoom(row) : null;
}

export async function getAvailableRoomIds(checkIn, checkOut) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc('get_available_room_ids', { p_check_in: checkIn, p_check_out: checkOut });
  if (error) throw friendly(error, 'Could not check room availability.');
  return (data || []).map(row => row.room_id ?? row.id ?? row).map(String);
}

export async function addRoom(room) {
  const row = await request(
    supabase.from('rooms').insert(toRow(room)).select('*').single(),
    'Could not add this room.'
  );
  return normalizeRoom(row);
}

export async function updateRoom(id, changes) {
  const row = await request(
    supabase.from('rooms').update(toRow(changes)).eq('id', id).select('*').single(),
    'Could not update this room.'
  );
  return normalizeRoom(row);
}

export async function deleteRoom(id) {
  await request(supabase.from('rooms').delete().eq('id', id), 'Could not delete this room.');
  return true;
}

export async function uploadRoomImage(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `rooms/${crypto.randomUUID()}.${ext}`;
  await request(
    supabase.storage.from('room-images').upload(path, file, { upsert: false, contentType: file.type }),
    'Could not upload this image.'
  );
  return supabase.storage.from('room-images').getPublicUrl(path).data.publicUrl;
}

export function subscribeToRoomChanges(callback) {
  if (!isSupabaseConfigured) return () => {};
  const channelId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase.channel(`public-room-inventory-${channelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel).catch(error => console.warn('[rooms realtime] channel cleanup failed', error)); };
}
