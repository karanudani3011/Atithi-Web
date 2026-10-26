import { ensureSupabaseConfigured, isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

// `status` is included so user-side cards can correctly disable unavailable rooms.
export const PUBLIC_ROOM_COLUMNS = 'id, room_name, room_type, description, price_per_night, capacity, amenities, image_urls, badge, bed_info, size_sqft, rating, units_left, status';
const WRITABLE_ROOM_COLUMNS = [
  'property_id', 'room_name', 'room_type', 'description', 'price_per_night',
  'capacity', 'amenities', 'image_urls', 'status', 'is_published', 'badge',
  'bed_info', 'size_sqft', 'rating', 'sort_order', 'units_left',
];

const friendly = (error, fallback) => new Error(error?.message || fallback);
const fromRow = (row) => ({
  ...row,
  amenities: Array.isArray(row?.amenities) ? row.amenities : [],
  image_urls: Array.isArray(row?.image_urls) ? row.image_urls.filter(Boolean) : [],
});
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

export async function getRooms() {
  const rows = await request(
    supabase.from('rooms')
      .select(PUBLIC_ROOM_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    'Could not load rooms.'
  );
  return (rows || []).map(fromRow);
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
  return row ? fromRow(row) : null;
}

export async function addRoom(room) {
  const row = await request(
    supabase.from('rooms').insert(toRow(room)).select('*').single(),
    'Could not add this room.'
  );
  return fromRow(row);
}

export async function updateRoom(id, changes) {
  const row = await request(
    supabase.from('rooms').update(toRow(changes)).eq('id', id).select('*').single(),
    'Could not update this room.'
  );
  return fromRow(row);
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
  const channel = supabase.channel('public-room-inventory')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
