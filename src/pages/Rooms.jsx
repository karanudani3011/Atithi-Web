import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Search, Minus, Plus } from 'lucide-react';
import PriceRangeSlider from '../components/PriceRangeSlider.jsx';
import Reveal from '../components/Reveal.jsx';
import RoomCard from '../components/RoomCard.jsx';
import useRooms from '../hooks/useRooms.js';
import { getBookedRanges } from '../services/bookingService.js';
import { filterRooms, hasRoomPopularity } from '../lib/roomFiltering.js';
import { DEFAULT_ROOM_FILTERS, ROOM_FILTER_TYPES, readRoomFilters, writeRoomFilters } from '../lib/roomFilterParams.js';

const categories = ['All', 'Deluxe', 'Suite', 'Family', 'Villa'];
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const nextDay = date => { const [year, month, day] = date.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10); };
const defaults = DEFAULT_ROOM_FILTERS;

export default function Rooms() {
  const roomState = useRooms();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readRoomFilters(searchParams));
  const [priceDraft, setPriceDraft] = useState([Number(filters.minPrice), Number(filters.maxPrice)]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookings, setBookings] = useState({});
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const priceFilterTimer = useRef(null);
  const dateError = filters.checkIn && filters.checkIn < today ? 'Check-in must be today or later.' : filters.checkOut && !filters.checkIn ? 'Choose a check-in date first.' : filters.checkOut && filters.checkIn && filters.checkOut <= filters.checkIn ? 'Check-out must be after check-in.' : '';
  const datesValid = Boolean(filters.checkIn && filters.checkOut && !dateError);

  // Keep the shareable URL as the source of truth after browser navigation.
  useEffect(() => setFilters(readRoomFilters(searchParams)), [searchParams]);
  useEffect(() => () => window.clearTimeout(priceFilterTimer.current), []);
  useEffect(() => setPriceDraft([Number(filters.minPrice), Number(filters.maxPrice)]), [filters.minPrice, filters.maxPrice]);
  useEffect(() => {
    if (!datesValid || !roomState.rooms.length) { setBookings({}); setAvailabilityError(''); setAvailabilityLoading(false); return; }
    let active = true;
    setAvailabilityLoading(true); setAvailabilityError('');
    Promise.all(roomState.rooms.map(async room => [room.id, await getBookedRanges(room.id)]))
      .then(entries => { if (active) setBookings(Object.fromEntries(entries)); })
      .catch(error => { if (active) { setAvailabilityError(error.message || 'Could not check room availability.'); setBookings({}); } })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [datesValid, filters.checkIn, filters.checkOut, roomState.rooms]);

  const update = (key, value) => {
    const next = { ...filters, [key]: String(value) };
    setFilters(next);
    window.clearTimeout(priceFilterTimer.current);
    setSearchParams(writeRoomFilters(next), { replace: true });
  };
  const changeType = type => update('type', type);
  const categoryIsActive = category => filters.type === category || (category === 'Deluxe' && ['Standard', 'Superior', 'Executive'].includes(filters.type)) || (category === 'Suite' && filters.type === 'Premium');
  const reset = () => {
    window.clearTimeout(priceFilterTimer.current);
    setFilters(defaults); setPriceDraft([1000, 10000]); setSearchParams(writeRoomFilters(defaults), { replace: true });
  };
  const onPrice = values => {
    const nextFilters = { ...filters, minPrice: String(values[0]), maxPrice: String(values[1]) };
    setPriceDraft(values);
    setFilters(nextFilters);
    window.clearTimeout(priceFilterTimer.current);
    priceFilterTimer.current = window.setTimeout(() => setSearchParams(writeRoomFilters(nextFilters), { replace: true }), 250);
  };

  const list = useMemo(() => filterRooms(roomState.rooms, filters, { bookings, datesValid, availabilityLoading, availabilityError }), [roomState.rooms, filters, bookings, datesValid, availabilityLoading, availabilityError]);

  const hasPopularity = hasRoomPopularity(roomState.rooms);
  const applyBookingSearch = () => {
    if (dateError) return;
    window.clearTimeout(priceFilterTimer.current);
    setSearchParams(writeRoomFilters(filters), { replace: true });
    setMobileOpen(false);
  };
  return <>
    <section className="inner-banner"><div className="banner-copy"><div className="eyebrow">REST WELL, FEEL AT HOME</div><h1>Rooms & <i>Suites</i></h1><p>Spaces made for unhurried mornings and memorable nights.</p></div></section>
    <section className="section rooms-page rooms-filter-section">
      <button className="filters-toggle" type="button" aria-expanded={mobileOpen} onClick={() => setMobileOpen(open => !open)}><ChevronDown size={17}/> Filters</button>
      <div className={`rooms-filter-card${mobileOpen ? ' is-open' : ''}`}>
        <div className="rooms-filter-grid">
          <label className="room-filter-field">Check-in<input type="date" min={today} value={filters.checkIn} onChange={event => update('checkIn', event.target.value)} aria-invalid={Boolean(dateError)} /></label>
          <label className="room-filter-field">Check-out<input type="date" min={filters.checkIn && filters.checkIn >= today ? nextDay(filters.checkIn) : today} value={filters.checkOut} onChange={event => update('checkOut', event.target.value)} aria-invalid={Boolean(dateError)} /></label>
          <div className="room-filter-field"><span id="adults-label">Adults</span><div className="guest-stepper"><button type="button" aria-label="Remove one adult" disabled={Number(filters.adults) <= 1} onClick={() => update('adults', Math.max(1, Number(filters.adults) - 1))}><Minus size={16}/></button><output aria-labelledby="adults-label">{filters.adults}</output><button type="button" aria-label="Add one adult" disabled={Number(filters.adults) >= 6} onClick={() => update('adults', Math.min(6, Number(filters.adults) + 1))}><Plus size={16}/></button></div></div>
          <div className="room-filter-field"><span id="children-label">Children</span><div className="guest-stepper"><button type="button" aria-label="Remove one child" disabled={Number(filters.children) <= 0} onClick={() => update('children', Math.max(0, Number(filters.children) - 1))}><Minus size={16}/></button><output aria-labelledby="children-label">{filters.children}</output><button type="button" aria-label="Add one child" disabled={Number(filters.children) >= 4} onClick={() => update('children', Math.min(4, Number(filters.children) + 1))}><Plus size={16}/></button></div></div>
          <label className="room-filter-field">Room type<select value={filters.type} onChange={event => changeType(event.target.value)}>{ROOM_FILTER_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
          <div className="room-filter-field price-range"><span>Price per night</span><PriceRangeSlider value={priceDraft} onChange={onPrice}/></div>
          <label className="room-filter-field sort-field">Sort by<select value={filters.sort} onChange={event => update('sort', event.target.value)}><option value="price-asc">Price low to high</option><option value="price-desc">Price high to low</option><option value="rating">Rating</option><option value="capacity">Capacity</option>{hasPopularity && <option value="popularity">Popularity</option>}</select></label>
          <div className="filter-actions"><button className="btn gold" type="button" onClick={applyBookingSearch}><Search size={16}/> Search / Apply</button><button className="reset-filter" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div>
        </div>
        {dateError && <p className="filter-error" role="alert">{dateError}</p>}
        {availabilityError && <p className="filter-error" role="alert">{availabilityError}</p>}
      </div>
      <div className="category-row" role="tablist" aria-label="Room categories">
        {categories.map(item => <button key={item} role="tab" aria-selected={categoryIsActive(item)} className={categoryIsActive(item) ? 'filter active' : 'filter'} onClick={() => changeType(item)}>{item}</button>)}
      </div>
      <p className="rooms-result-count" aria-live="polite">{availabilityLoading ? 'Checking availability…' : `${list.length} ${list.length === 1 ? 'room' : 'rooms'} found`}</p>
      {roomState.loading ? <div className="room-grid">{[1,2,3].map(item => <div className="room-card room-skeleton" key={item} aria-label="Loading room" />)}</div>
        : roomState.error ? <div className="empty-state"><p>{roomState.error}</p><button className="btn gold" onClick={roomState.retry}>Try again</button></div>
          : availabilityLoading ? <p className="availability-loading" role="status">Checking room availability for your dates…</p>
          : list.length ? <div className="room-grid">{list.map((room, i) => <Reveal key={room.id} delay={i * .06}><RoomCard room={room} bookingQuery={filters} /></Reveal>)}</div>
            : <div className="rooms-empty"><h3>No rooms found</h3><p>Try changing your dates or filters.</p><button className="btn gold" type="button" onClick={reset}>Reset filters</button></div>}
    </section>
  </>;
}
