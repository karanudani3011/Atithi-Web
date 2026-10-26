import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { displayDate, localDateString } from './dateOnly.js';
import './booking-fields.css';

const monthLabel = (year, month) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
export default function DateField({ label, value, onChange, min, variant = 'page', id, error = '', isDateDisabled }) {
  const inputId = id || `date-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const customCalendar = typeof isDateDisabled === 'function';
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const seed = value || min || localDateString(); return new Date(`${seed}T12:00:00`); });
  const popupRef = useRef(null);
  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);
  useEffect(() => {
    if (!open || !value) return;
    const selected = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(selected.getTime())) setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [open, value]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!popupRef.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, [open]);
  const disabled = day => { const date = localDateString(new Date(month.getFullYear(), month.getMonth(), day)); return Boolean((min && date < min) || isDateDisabled?.(date)); };
  const control = customCalendar
    ? <button id={inputId} type="button" className="date-field-control date-field-calendar-trigger" aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}: ${value ? displayDate(value) : 'select date'}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onClick={() => setOpen(current => !current)}><span className={`date-field-value${value ? ' has-date' : ''}`}>{displayDate(value)}</span><CalendarDays className="date-field-icon" size={17} aria-hidden="true"/></button>
    : <span className="date-field-control"><span className={`date-field-value${value ? ' has-date' : ''}`} aria-hidden="true">{displayDate(value)}</span><CalendarDays className="date-field-icon" size={17} aria-hidden="true"/><input id={inputId} className="date-field-native" type="date" lang="en-GB" value={value || ''} min={min || undefined} onChange={event => onChange(event.target.value)} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined}/></span>;
  return <div className={`date-field date-field-${variant} ${variant === 'hero' ? 'search-field' : 'room-filter-field'}${customCalendar ? ' has-custom-calendar' : ''}`} ref={popupRef}>
    <label htmlFor={inputId}>{label}</label>
    {control}
    {open && customCalendar && <div className="date-calendar-popover" role="dialog" aria-label={`${label} calendar`}><div className="date-calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17}/></button><strong>{monthLabel(month.getFullYear(), month.getMonth())}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17}/></button></div><div className="date-calendar-grid" role="grid" aria-label={monthLabel(month.getFullYear(), month.getMonth())}>{['Su','Mo','Tu','We','Th','Fr','Sa'].map(day=><span role="columnheader" key={day}>{day}</span>)}{monthDays.map((day,index)=>day===null?<span key={`blank-${index}`} aria-hidden="true"/>:<button key={day} type="button" role="gridcell" disabled={disabled(day)} aria-selected={value===localDateString(new Date(month.getFullYear(),month.getMonth(),day))} className={value===localDateString(new Date(month.getFullYear(),month.getMonth(),day))?'selected':''} onClick={()=>{onChange(localDateString(new Date(month.getFullYear(),month.getMonth(),day)));setOpen(false);}}>{day}</button>)}</div></div>}
    {error && <small className="date-field-error" id={`${inputId}-error`} role="alert">{error}</small>}
  </div>;
}
