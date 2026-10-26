export const ROOM_FILTER_TYPES = ['All', 'Standard', 'Deluxe', 'Superior', 'Executive', 'Premium', 'Family', 'Suite', 'Villa'];
export const DEFAULT_ROOM_FILTERS = { checkIn: '', checkOut: '', adults: '1', children: '0', type: 'All', minPrice: '1000', maxPrice: '10000', sort: 'price-asc' };

export function readRoomFilters(params) {
  const values = Object.fromEntries(Object.keys(DEFAULT_ROOM_FILTERS).map(key => [key, params.get(key) || DEFAULT_ROOM_FILTERS[key]]));
  values.minPrice = params.get('min') || params.get('minPrice') || DEFAULT_ROOM_FILTERS.minPrice;
  values.maxPrice = params.get('max') || params.get('maxPrice') || DEFAULT_ROOM_FILTERS.maxPrice;
  values.type = ROOM_FILTER_TYPES.find(type => type.toLowerCase() === String(values.type).toLowerCase()) || 'All';
  values.sort = (params.get('sort') || DEFAULT_ROOM_FILTERS.sort).replace('_', '-');

  const parsedMin = Number(values.minPrice);
  const parsedMax = Number(values.maxPrice);
  const minPrice = Math.max(1000, Math.min(9500, Math.round((Number.isFinite(parsedMin) ? parsedMin : 1000) / 500) * 500));
  const maxPrice = Math.max(minPrice + 500, Math.min(10000, Math.round((Number.isFinite(parsedMax) ? parsedMax : 10000) / 500) * 500));
  const adults = Number(values.adults);
  const children = Number(values.children);
  return {
    ...values,
    adults: String(Math.max(1, Math.min(6, Number.isFinite(adults) ? Math.round(adults) : 1))),
    children: String(Math.max(0, Math.min(4, Number.isFinite(children) ? Math.round(children) : 0))),
    minPrice: String(minPrice),
    maxPrice: String(maxPrice),
  };
}

export function writeRoomFilters(values) {
  const params = new URLSearchParams();
  const entries = [['checkIn', 'checkIn'], ['checkOut', 'checkOut'], ['adults', 'adults'], ['children', 'children'], ['type', 'type'], ['min', 'minPrice'], ['max', 'maxPrice'], ['sort', 'sort']];
  entries.forEach(([key, stateKey]) => {
    const value = stateKey === 'sort' ? values[stateKey].replace('-', '_') : stateKey === 'type' ? values[stateKey].toLowerCase() : values[stateKey];
    if (value) params.set(key, value);
  });
  return params;
}
