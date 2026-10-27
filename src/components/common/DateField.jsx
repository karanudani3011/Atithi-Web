import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { displayDate, localDateString } from './dateOnly.js';
import { calendarMonth, shiftCalendarMonth } from '../../booking/availabilityDates.js';
import './booking-fields.css';

const parseDate = value => new Date(`${value}T12:00:00`);
const monthLabel = date => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
const formatDate = (year, month, day) => localDateString(new Date(year, month, day, 12));

export default function DateField({ label, value, onChange, min, variant = 'page', id, error = '', isDateDisabled, bookedDates = [], isCheckout = false, initialMonth = '' }) {
  const inputId = id || `date-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const customCalendar = typeof isDateDisabled === 'function';
  const todayMonth = calendarMonth(parseDate(localDateString()));
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => calendarMonth(parseDate(value || initialMonth || min || localDateString())));
  const popupRef = useRef(null);
  const booked = useMemo(() => new Set(bookedDates), [bookedDates]);
  const firstBooked = isCheckout && min ? bookedDates.filter(date => date >= min).sort()[0] || '' : '';
  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  useEffect(() => {
    if (!open || !value) return;
    const selected = parseDate(value);
    if (!Number.isNaN(selected.getTime())) setMonth(calendarMonth(selected));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!popupRef.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, [open]);

  const disabled = day => {
    const date = formatDate(month.getFullYear(), month.getMonth(), day);
    const isCheckoutBoundary = isCheckout && date === firstBooked;
    return Boolean((min && date < min) || (isCheckout && firstBooked && date > firstBooked) || (booked.has(date) && !isCheckoutBoundary) || isDateDisabled?.(date));
  };
  const toggleCalendar = () => {
    if (open) { setOpen(false); return; }
    const seed = value || initialMonth || min || localDateString();
    setMonth(calendarMonth(parseDate(seed)));
    setOpen(true);
  };
  const previousDisabled = month.getFullYear() < todayMonth.getFullYear()
    || (month.getFullYear() === todayMonth.getFullYear() && month.getMonth() <= todayMonth.getMonth());

  const control = customCalendar
    ? <button id={inputId} type="button" className="date-field-control date-field-calendar-trigger" aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}: ${value ? displayDate(value) : 'select date'}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onClick={toggleCalendar}><span className={`date-field-value${value ? ' has-date' : ''}`}>{displayDate(value)}</span><CalendarDays className="date-field-icon" size={17} aria-hidden="true"/></button>
    : <span className="date-field-control"><span className={`date-field-value${value ? ' has-date' : ''}`} aria-hidden="true">{displayDate(value)}</span><CalendarDays className="date-field-icon" size={17} aria-hidden="true"/><input id={inputId} className="date-field-native" type="date" lang="en-GB" value={value || ''} min={min || undefined} onChange={event => onChange(event.target.value)} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined}/></span>;

  return <div className={`date-field date-field-${variant} ${variant === 'hero' ? 'search-field' : 'room-filter-field'}${customCalendar ? ' has-custom-calendar' : ''}${open ? ' is-open' : ''}`} ref={popupRef}>
    <label htmlFor={inputId}>{label}</label>
    {control}
    {open && customCalendar && <div className="date-calendar-popover" role="dialog" aria-label={`${label} calendar`}>
      <div className="date-calendar-heading">
        <button type="button" aria-label="Previous month" disabled={previousDisabled} onClick={() => setMonth(current => shiftCalendarMonth(current, -1))}><ChevronLeft size={17}/></button>
        <strong>{monthLabel(month)}</strong>
        <button type="button" aria-label="Next month" onClick={() => setMonth(current => shiftCalendarMonth(current, 1))}><ChevronRight size={17}/></button>
      </div>
      <div className="date-calendar-grid" role="grid" aria-label={monthLabel(month)}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => <span role="columnheader" key={day}>{day}</span>)}
        {monthDays.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true"/>;
          const date = formatDate(month.getFullYear(), month.getMonth(), day);
          const isBooked = booked.has(date);
          const checkoutBoundary = isCheckout && date === firstBooked;
          const classes = [value === date ? 'selected' : '', isBooked ? checkoutBoundary ? 'is-booked-boundary' : 'is-booked' : ''].filter(Boolean).join(' ');
          return <button key={date} type="button" role="gridcell" disabled={disabled(day)} aria-selected={value === date} aria-label={`${date}${isBooked ? ', Booked' : ''}`} title={isBooked ? 'Already booked' : undefined} className={classes} onClick={() => { onChange(date); setOpen(false); }}>{day}</button>;
        })}
      </div>
    </div>}
    {error && <small className="date-field-error" id={`${inputId}-error`} role="alert">{error}</small>}
  </div>;
}
