export const DEFAULT_ROOM_FILTERS = { checkIn: '', checkOut: '', adults: '1', children: '0', type: 'All', minPrice: '', maxPrice: '', sort: 'price-asc' };

export function readRoomFilters(params) {
  const values = Object.fromEntries(Object.keys(DEFAULT_ROOM_FILTERS).map(key => [key, params.get(key) || DEFAULT_ROOM_FILTERS[key]]));
  values.minPrice = params.get('min') || params.get('minPrice') || DEFAULT_ROOM_FILTERS.minPrice;
  values.maxPrice = params.get('max') || params.get('maxPrice') || DEFAULT_ROOM_FILTERS.maxPrice;
  values.type = String(values.type || 'All').trim().slice(0, 60) || 'All';
  if (values.type.toLowerCase() === 'all') values.type = 'All';
  values.sort = (params.get('sort') || DEFAULT_ROOM_FILTERS.sort).replaceAll('_', '-');

  const legacyDefaultRange = Number(values.minPrice) === 1000 && Number(values.maxPrice) === 10000;
  const minPrice = !legacyDefaultRange && (params.has('min') || params.has('minPrice')) ? String(Math.max(0, Number(values.minPrice) || 0)) : '';
  const maxPrice = !legacyDefaultRange && (params.has('max') || params.has('maxPrice')) ? String(Math.max(0, Number(values.maxPrice) || 0)) : '';
  const adults = Number(values.adults);
  const children = Number(values.children);
  return {
    ...values,
    adults: String(Math.max(1, Math.min(6, Number.isFinite(adults) ? Math.round(adults) : 1))),
    children: String(Math.max(0, Math.min(4, Number.isFinite(children) ? Math.round(children) : 0))),
    minPrice,
    maxPrice,
  };
}

export function writeRoomFilters(values) {
  const params = new URLSearchParams();
  const entries = [['checkIn', 'checkIn'], ['checkOut', 'checkOut'], ['adults', 'adults'], ['children', 'children'], ['type', 'type'], ['min', 'minPrice'], ['max', 'maxPrice'], ['sort', 'sort']];
  entries.forEach(([key, stateKey]) => {
    const value = stateKey === 'sort' ? values[stateKey].replace('-', '_') : stateKey === 'type' ? values[stateKey].toLowerCase() : values[stateKey];
    if (value !== '' && value != null && !(stateKey === 'type' && String(value).toLowerCase() === 'all')) params.set(key, value);
  });
  return params;
}
