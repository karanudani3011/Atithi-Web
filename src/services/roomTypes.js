import { adminSupabase as db, ensureAdminSupabase, friendlyAdminError } from '../lib/adminSupabase.js';

const columns = 'id, name, slug, description, sort_order, is_active';
let cachedTypes = null;
let pendingRequest = null;
const listeners = new Set();

function publish(types) {
  cachedTypes = types;
  listeners.forEach(listener => listener(types));
}

export async function getRoomTypes({ force = false } = {}) {
  ensureAdminSupabase();
  if (!force && cachedTypes) return cachedTypes;
  if (!force && pendingRequest) return pendingRequest;
  pendingRequest = db.from('room_types')
    .select(columns)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw friendlyAdminError(error, 'Could not load room types.');
      const types = data || [];
      publish(types);
      return types;
    })
    .finally(() => { pendingRequest = null; });
  return pendingRequest;
}

export async function refreshRoomTypes() {
  cachedTypes = null;
  pendingRequest = null;
  return getRoomTypes({ force: true });
}

export function subscribeToRoomTypes(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function friendlyTypeError(error) {
  if (error?.code === '23505') return new Error('A room type with this name already exists.');
  if (error?.code === '23503') return new Error('This room type is used by rooms. Deactivate it instead.');
  return friendlyAdminError(error, 'Could not save this room type.');
}

export async function createRoomType({ name, description = '' }) {
  ensureAdminSupabase();
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 60) throw new Error('Enter a room type name up to 60 characters.');
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
  const { data, error } = await db.from('room_types')
    .insert({ name: cleanName, description: String(description || '').trim() || null, slug })
    .select(columns).single();
  if (error) throw friendlyTypeError(error);
  await refreshRoomTypes();
  return data;
}

export async function updateRoomType(id, changes) {
  ensureAdminSupabase();
  const updates = { ...changes };
  if (Object.hasOwn(updates, 'name')) {
    updates.name = String(updates.name || '').trim();
    if (!updates.name || updates.name.length > 60) throw new Error('Enter a room type name up to 60 characters.');
    updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
  }
  if (Object.hasOwn(updates, 'description')) updates.description = String(updates.description || '').trim() || null;
  const { data, error } = await db.from('room_types').update(updates).eq('id', id).select(columns).single();
  if (error) throw friendlyTypeError(error);
  await refreshRoomTypes();
  return data;
}

export async function deleteRoomType(id) {
  ensureAdminSupabase();
  const { count, error: countError } = await db.from('rooms').select('id', { count: 'exact', head: true }).eq('room_type_id', id);
  if (countError) throw friendlyAdminError(countError, 'Could not check room type usage.');
  if (count > 0) throw new Error(`This room type is used by ${count} rooms. Deactivate it instead.`);
  const { error } = await db.from('room_types').delete().eq('id', id);
  if (error) throw friendlyTypeError(error);
  await refreshRoomTypes();
}
