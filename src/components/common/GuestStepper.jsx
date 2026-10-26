import { Minus, Plus } from 'lucide-react';

export default function GuestStepper({ label, value, onChange, min, max, variant = 'page', id }) {
  const labelId = `${id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-label`;
  const number = Number(value);
  return <div className={`guest-stepper-field guest-stepper-field-${variant} ${variant === 'hero' ? 'search-field' : 'room-filter-field'}`}>
    <span id={labelId}>{label}</span>
    <div className={`guest-stepper guest-stepper-${variant}`} role="group" aria-labelledby={labelId}>
      <button type="button" aria-label={`${label} ghatado`} disabled={number <= min} onClick={() => onChange(Math.max(min, number - 1))}><Minus size={15} /></button>
      <output aria-live="polite" aria-atomic="true">{number}</output>
      <button type="button" aria-label={`${label} vadharo`} disabled={number >= max} onClick={() => onChange(Math.min(max, number + 1))}><Plus size={15} /></button>
    </div>
  </div>;
}
