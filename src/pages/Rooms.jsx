import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import PriceRangeSlider from '../components/PriceRangeSlider.jsx';
import DateField from '../components/common/DateField.jsx';
import GuestStepper from '../components/common/GuestStepper.jsx';
import { localDateString, nextDate } from '../components/common/dateOnly.js';
import Reveal from '../components/Reveal.jsx';
import RoomCard from '../components/RoomCard.jsx';
import useRooms from '../hooks/useRooms.js';
import { getBookedRanges } from '../services/bookingService.js';
import { filterRooms, hasRoomPopularity } from '../lib/roomFiltering.js';
import { DEFAULT_ROOM_FILTERS, ROOM_FILTER_TYPES, readRoomFilters, writeRoomFilters } from '../lib/roomFilterParams.js';

const categories = ['All', 'Deluxe', 'Suite', 'Family', 'Villa'];
const today = localDateString();
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
    if (key === 'checkIn' && next.checkOut && next.checkOut <= String(value)) next.checkOut = value ? nextDate(String(value)) : '';
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
          <DateField label="Check-in" id="rooms-check-in" variant="page" min={today} value={filters.checkIn} onChange={value => update('checkIn', value)} />
          <DateField label="Check-out" id="rooms-check-out" variant="page" min={filters.checkIn && filters.checkIn >= today ? nextDate(filters.checkIn) : today} value={filters.checkOut} onChange={value => update('checkOut', value)} />
          <GuestStepper id="rooms-adults" label="Adults" value={Number(filters.adults)} min={1} max={6} variant="page" onChange={value => update('adults', value)} />
          <GuestStepper id="rooms-children" label="Children" value={Number(filters.children)} min={0} max={4} variant="page" onChange={value => update('children', value)} />
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
