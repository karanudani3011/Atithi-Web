import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import PriceRangeSlider from '../components/PriceRangeSlider.jsx';
import DateField from '../components/common/DateField.jsx';
import GuestStepper from '../components/common/GuestStepper.jsx';
import { localDateString, nextDate } from '../components/common/dateOnly.js';
import Reveal from '../components/Reveal.jsx';
import RoomCard from '../components/RoomCard.jsx';
import { searchRooms } from '../services/roomService.js';
import { DEFAULT_ROOM_FILTERS, readRoomFilters, writeRoomFilters } from '../lib/roomFilterParams.js';
import useRoomTypes from '../hooks/useRoomTypes.js';

const today = localDateString();
const addDays = (date, days) => localDateString(new Date(new Date(date + 'T12:00:00').getFullYear(), new Date(date + 'T12:00:00').getMonth(), new Date(date + 'T12:00:00').getDate() + days));
const isDateOnly = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) && new Date(`${value}T12:00:00`).toISOString().slice(0, 10) === value;

export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readRoomFilters(searchParams));
  const { types: roomTypes, loading: typesLoading, error: typesError } = useRoomTypes({ activeOnly: true });
  const [rooms, setRooms] = useState([]);
  const [priceBounds, setPriceBounds] = useState([0, 10000]);
  const [priceDraft, setPriceDraft] = useState([Number(filters.minPrice) || 0, Number(filters.maxPrice) || 10000]);
  const [priceTouched, setPriceTouched] = useState(Boolean(filters.minPrice || filters.maxPrice));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyDates, setNearbyDates] = useState([]);
  const [reload, setReload] = useState(0);
  const [applyNow, setApplyNow] = useState(0);
  const timer = useRef(null);
  const dateError = filters.checkIn && !isDateOnly(filters.checkIn) ? 'Enter a valid check-in date.'
    : filters.checkOut && !isDateOnly(filters.checkOut) ? 'Enter a valid check-out date.'
      : filters.checkIn && filters.checkIn < today ? 'Check-in must be today or later.'
    : filters.checkOut && !filters.checkIn ? 'Choose a check-in date first.'
      : filters.checkOut && filters.checkIn && filters.checkOut <= filters.checkIn ? 'Check-out must be after check-in.' : '';
  const datesValid = Boolean(filters.checkIn && filters.checkOut && !dateError);
  const browseMode = !filters.checkIn && !filters.checkOut;

  useEffect(() => setFilters(readRoomFilters(searchParams)), [searchParams]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    let active = true;
    searchRooms({ adults: 0, children: 0 }).then(({ rooms: base }) => {
      if (!active) return;
      const prices = base.map(room => Number(room.price_per_night)).filter(value => Number.isFinite(value) && value >= 0);
      const low = prices.length ? Math.min(...prices) : 0;
      const high = prices.length ? Math.max(...prices) : 10000;
      setPriceBounds([low, high > low ? high : low + 1]);
      if (!priceTouched) setPriceDraft([low, high > low ? high : low + 1]);
    }).catch(failure => {
      if (!active) return;
      console.error('[rooms] base listing failed', failure);
      setError('Something went wrong, please retry.');
    });
    return () => { active = false; };
  }, [reload]);

  const selectedType = roomTypes.find(type => type.name.toLowerCase() === String(filters.type).toLowerCase());
  const load = useCallback(async () => {
    if (dateError) { setError(''); setLoading(false); return; }
    if (filters.type.toLowerCase() !== 'all' && typesLoading) return;
    setLoading(true);
    setError('');
    const params = {
      checkIn: datesValid ? filters.checkIn : null,
      checkOut: datesValid ? filters.checkOut : null,
      adults: Number(filters.adults),
      children: Number(filters.children),
      roomTypeId: filters.type.toLowerCase() === 'all' ? null : selectedType?.id || null,
      minPrice: filters.minPrice || null,
      maxPrice: filters.maxPrice || null,
      sort: filters.sort.replaceAll('-', '_'),
    };
    try {
      const result = await searchRooms(params);
      setRooms(result.rooms);
      setNearbyDates([]);
    } catch (failure) {
      console.error('[rooms] listing request failed', { params, message: failure.message, details: failure.details, hint: failure.hint, code: failure.code, error: failure });
      setError('Something went wrong, please retry.');
      setRooms([]);
    } finally { setLoading(false); }
  }, [dateError, datesValid, filters, selectedType?.id, typesLoading]);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSearchParams(writeRoomFilters(filters), { replace: true });
      load();
    }, applyNow ? 0 : 220);
    return () => window.clearTimeout(timer.current);
  }, [filters, load, applyNow, reload]);

  const update = (key, value) => {
    const next = { ...filters, [key]: String(value) };
    if (key === 'checkIn' && next.checkOut && next.checkOut <= String(value)) next.checkOut = value ? nextDate(String(value)) : '';
    setFilters(next);
    setNearbyDates([]);
  };
  const changeType = value => update('type', value || 'All');
  const categoryIsActive = category => String(filters.type).toLowerCase() === category.toLowerCase();
  const reset = () => {
    window.clearTimeout(timer.current);
    setPriceTouched(false);
    setPriceDraft(priceBounds);
    setFilters(DEFAULT_ROOM_FILTERS);
    setNearbyDates([]);
    setSearchParams(writeRoomFilters(DEFAULT_ROOM_FILTERS), { replace: true });
    setApplyNow(value => value + 1);
  };
  const onPrice = values => {
    setPriceTouched(true);
    setPriceDraft(values);
    setFilters(current => ({ ...current, minPrice: String(values[0]), maxPrice: String(values[1]) }));
  };
  const applyBookingSearch = () => {
    if (dateError) return;
    setMobileOpen(false);
    setApplyNow(value => value + 1);
  };

  async function suggestNearbyDates() {
    if (!filters.checkIn || !filters.checkOut) return;
    const nights = Math.round((new Date(filters.checkOut + 'T12:00:00') - new Date(filters.checkIn + 'T12:00:00')) / 86400000);
    setNearbyLoading(true);
    setError('');
    const candidates = [-3, -2, -1, 1, 2, 3].map(offset => {
      const checkIn = addDays(filters.checkIn, offset);
      return { offset, checkIn, checkOut: addDays(checkIn, nights) };
    }).filter(item => item.checkIn >= today);
    try {
      const results = await Promise.all(candidates.map(async item => {
        const result = await searchRooms({ checkIn: item.checkIn, checkOut: item.checkOut, adults: Number(filters.adults), children: Number(filters.children),
          roomTypeId: filters.type.toLowerCase() === 'all' ? null : selectedType?.id || null,
          minPrice: filters.minPrice || null, maxPrice: filters.maxPrice || null, sort: filters.sort.replaceAll('-', '_') });
        return { ...item, available: result.rooms.length > 0 };
      }));
      const found = results.filter(item => item.available).sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
      setNearbyDates(found);
      if (!found.length) setError('No nearby dates have availability for these filters.');
    } catch (failure) {
      console.error('[rooms] nearby date search failed', failure);
      setError('Something went wrong, please retry.');
    } finally { setNearbyLoading(false); }
  }

  const typeOptions = useMemo(() => ['All', ...roomTypes.map(type => type.name)], [roomTypes]);
  const priceValues = priceTouched ? priceDraft : priceBounds;
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
          <label className="room-filter-field">Room type<select value={filters.type.toLowerCase() === 'all' ? 'All' : selectedType?.name || filters.type} onChange={event => changeType(event.target.value)}>{typeOptions.map(type => <option key={type} value={type}>{type === 'All' ? 'All room types' : type}</option>)}</select></label>
          <div className="room-filter-field price-range"><span>Price per night</span><PriceRangeSlider min={priceBounds[0]} max={priceBounds[1]} value={priceValues} onChange={onPrice}/></div>
          <label className="room-filter-field sort-field">Sort by<select value={filters.sort} onChange={event => update('sort', event.target.value)}><option value="price-asc">Price low to high</option><option value="price-desc">Price high to low</option><option value="rating">Rating</option><option value="newest">Newest</option></select></label>
          <div className="filter-actions"><button className="btn gold" type="button" onClick={applyBookingSearch}><Search size={16}/> Search / Apply</button><button className="reset-filter" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div>
        </div>
        {dateError && <p className="filter-error" role="alert">{dateError}</p>}
        {typesError && <p className="filter-error" role="alert">{typesError}</p>}
      </div>
      <div className="category-row" role="tablist" aria-label="Room categories">
        {typeOptions.map(item => <button key={item} role="tab" aria-selected={categoryIsActive(item)} className={categoryIsActive(item) ? 'filter active' : 'filter'} onClick={() => changeType(item)}>{item}</button>)}
      </div>
      {browseMode && <p className="room-availability-hint">Select dates to see live availability.</p>}
      <p className="rooms-result-count" aria-live="polite">{dateError ? 'Please correct your dates to check availability.' : loading ? 'Loading rooms…' : datesValid ? `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} available for your dates` : `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} found`}</p>
      {loading ? <div className="room-grid">{[1,2,3].map(item => <div className="room-card room-skeleton" key={item} aria-label="Loading room" />)}</div>
        : dateError ? <div className="rooms-empty"><h3>Check your dates</h3><p>{dateError}</p></div>
        : error ? <div className="rooms-empty"><h3>Something went wrong, please retry</h3><p>{error}</p><button className="btn gold" type="button" onClick={() => setReload(value => value + 1)}>Retry</button></div>
          : rooms.length ? <div className="room-grid">{rooms.map((room, i) => <Reveal key={room.id} delay={i * .06}><RoomCard room={room} bookingQuery={filters} /></Reveal>)}</div>
            : <div className="rooms-empty"><h3>{datesValid ? 'No rooms available for these dates' : 'No rooms match your filters'}</h3><p>{datesValid ? 'Try nearby dates or adjust your filters.' : 'Adjust your filters or reset to see all published rooms.'}</p>{datesValid&&<><button className="btn gold" type="button" disabled={nearbyLoading} onClick={suggestNearbyDates}>{nearbyLoading?'Checking nearby dates…':'Suggest nearby dates'}</button>{nearbyDates.map(item=><button type="button" className="reset-filter nearby-date-option" key={item.checkIn} onClick={()=>{update('checkIn',item.checkIn);update('checkOut',item.checkOut);}}>{item.checkIn} – {item.checkOut}</button>)}</>}<button className="reset-filter" type="button" onClick={reset}>Reset filters</button></div>}
    </section>
  </>;
}
