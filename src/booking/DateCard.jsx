import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { localDateString, nextDate } from '../components/common/dateOnly.js';

const parseDate = value => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
const dateKey = date => localDateString(date);
const monthStart = date => new Date(date.getFullYear(), date.getMonth(), 1, 12);
const shiftMonth = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
const format = value => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(parseDate(value));

export default function DateCard({ label, value, min, max, onChange, error, bookedDates = [], isCheckout = false }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => value ? monthStart(parseDate(value)) : monthStart(parseDate(min || localDateString())));
  const [focusDate, setFocusDate] = useState(value || min || localDateString());
  const root = useRef(null);
  const booked = useMemo(() => new Set(bookedDates), [bookedDates]);
  const firstBooked = isCheckout && min ? bookedDates.filter(day => day >= min).sort()[0] : null;
  const days = useMemo(() => {
    const offset = (monthStart(view).getDay() + 6) % 7;
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
      const day = i - offset + 1;
      return day < 1 || day > count ? null : dateKey(new Date(view.getFullYear(), view.getMonth(), day, 12));
    });
  }, [view]);

  useEffect(() => {
    if (!open) return;
    const onKey = event => {
      if (event.key === 'Escape') { setOpen(false); return; }
      const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!movement) return;
      event.preventDefault();
      const next = parseDate(focusDate);
      next.setDate(next.getDate() + movement);
      const key = dateKey(next);
      setFocusDate(key);
      if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) setView(monthStart(next));
      root.current?.querySelector(`[data-date="${key}"]`)?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, focusDate, view]);

  const openCalendar = () => {
    setFocusDate(value || min || localDateString());
    setView(monthStart(parseDate(value || min || localDateString())));
    setOpen(true);
  };
  const choose = date => {
    const isBookedNight = booked.has(date);
    const checkoutBoundary = isCheckout && date === firstBooked;
    if (date < (min || localDateString()) || (max && date > max) || (isBookedNight && !checkoutBoundary)) return;
    onChange(date);
    setOpen(false);
  };

  return <div className="date-card-wrap" ref={root}>
    <button type="button" className="date-card" onClick={openCalendar} aria-haspopup="dialog" aria-expanded={open}>
      <span><CalendarDays size={17}/>{label}</span>
      <strong>{value ? format(value) : 'Select date'}</strong>
      <small>{value ? new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(parseDate(value)) : 'Choose your stay date'}</small>
      {error && <small className="booking-field-error">{error}</small>}
    </button>
    {open && createPortal(<div className="date-calendar-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="date-calendar" role="dialog" aria-modal="true" aria-label={`${label} calendar`}>
        <header><button type="button" aria-label="Previous month" onClick={() => setView(shiftMonth(view, -1))}><ChevronLeft/></button><h3>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(view)}</h3><button type="button" aria-label="Next month" onClick={() => setView(shiftMonth(view, 1))}><ChevronRight/></button></header>
        <div className="date-calendar-grid" role="grid" aria-label="Choose a date">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <span className="date-calendar-weekday" key={day}>{day}</span>)}{days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const isBooked = booked.has(day);
          const checkoutBoundary = isCheckout && day === firstBooked;
          const disabled = day < (min || localDateString()) || (max && day > max) || (isBooked && !checkoutBoundary);
          const classes = ['date-calendar-day', isBooked ? 'is-booked' : '', value === day ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
          return <button key={day} data-date={day} type="button" role="gridcell" className={classes} aria-label={`${format(day)}${isBooked ? ', Booked' : ''}`} aria-disabled={disabled} title={isBooked ? (checkoutBoundary ? 'Booked night; checkout is allowed' : 'Booked') : undefined} tabIndex={day === focusDate ? 0 : -1} onFocus={() => setFocusDate(day)} onClick={() => choose(day)}>{Number(day.slice(-2))}</button>;
        })}</div>
        <div className="date-calendar-legend"><span><i/>Available</span><span><i className="legend-booked"/>Booked</span><span><i className="legend-selected"/>Selected</span></div>
      </section>
    </div>, document.body)}
  </div>;
}
