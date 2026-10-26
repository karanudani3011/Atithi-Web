import { CalendarDays } from 'lucide-react';
import { displayDate } from './dateOnly.js';
import './booking-fields.css';

export default function DateField({ label, value, onChange, min, variant = 'page', id, error = '' }) {
  const inputId = id || `date-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <div className={`date-field date-field-${variant} ${variant === 'hero' ? 'search-field' : 'room-filter-field'}`}>
    <label htmlFor={inputId}>{label}</label>
    <span className="date-field-control">
      <span className={`date-field-value${value ? ' has-date' : ''}`} aria-hidden="true">{displayDate(value)}</span>
      <CalendarDays className="date-field-icon" size={17} aria-hidden="true" />
      <input id={inputId} className="date-field-native" type="date" lang="en-GB" value={value || ''} min={min || undefined}
        onChange={(event) => onChange(event.target.value)} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} />
    </span>
    {error && <small className="date-field-error" id={`${inputId}-error`} role="alert">{error}</small>}
  </div>;
}
