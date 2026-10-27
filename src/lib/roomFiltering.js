import { roomCapacity, roomPrice } from './roomUtils.js';

const normalize = value => String(value || '').trim().toLowerCase();
const matchesType = (room, type) => {
  if (!type || normalize(type) === 'all') return true;
  if (filtersTypeId(type)) return String(room.room_type_id || '') === String(filtersTypeId(type));
  const category = normalize(room.room_type || room.category || room.type);
  return category === normalize(type);
};
const filtersTypeId = type => typeof type === 'object' ? type.id : null;
const popularity = room => Number(room.popularity_score ?? room.popularity ?? room.booking_count ?? room.bookings_count ?? room.view_count ?? 0);
const overlaps = (range, checkIn, checkOut) => {
  const start = range.check_in || range.checkIn || range.start || range.from;
  const end = range.check_out || range.checkOut || range.end || range.to;
  return Boolean(start && end && start < checkOut && end > checkIn);
};

/** Applies all room filters together, then sorts only the matching rooms. */
export function filterRooms(rooms, filters, { bookings = {}, datesValid = false, availabilityLoading = false, availabilityError = '' } = {}) {
  const filtered = rooms.filter(room => {
    const price = roomPrice(room);
    const adults = Number(filters.adults);
    const children = Number(filters.children);
    const adultCapacity = room.adult_capacity ?? room.max_adults ?? room.capacity_adults;
    const childCapacity = room.children_capacity ?? room.max_children ?? room.capacity_children;
    const availabilityKnown = !datesValid || (!availabilityLoading && !availabilityError);
    const available = availabilityKnown && (!datesValid || !(bookings[room.id] || []).some(range => overlaps(range, filters.checkIn, filters.checkOut)));
    return matchesType(room, filters.type)
      && (room.capacity == null || roomCapacity(room) >= adults + children)
      && (adultCapacity == null || Number(adultCapacity) >= adults)
      && (childCapacity == null || Number(childCapacity) >= children)
      && (!filters.minPrice || price >= Number(filters.minPrice))
      && (!filters.maxPrice || price <= Number(filters.maxPrice))
      && available;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === 'price-desc') return roomPrice(b) - roomPrice(a);
    if (filters.sort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
    if (filters.sort === 'newest') return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    if (filters.sort === 'capacity') return roomCapacity(b) - roomCapacity(a);
    if (filters.sort === 'popularity') return popularity(b) - popularity(a);
    return roomPrice(a) - roomPrice(b);
  });
}

export function hasRoomPopularity(rooms) {
  return rooms.some(room => room.popularity_score != null || room.popularity != null || room.booking_count != null || room.bookings_count != null || room.view_count != null);
}
