import { useId } from 'react';

export default function PriceRangeSlider({ value, onChange, min = 0, max = 10000 }) {
  const id = useId();
  const [minValue, maxValue] = value;
  const span = Math.max(1, max - min);
  const step = Math.max(1, Math.ceil(span / 100));
  const lower = ((minValue - min) / span) * 100;
  const upper = ((maxValue - min) / span) * 100;
  const updateMin = next => onChange([Math.min(Number(next), maxValue - step), maxValue]);
  const updateMax = next => onChange([minValue, Math.max(Number(next), minValue + step)]);

  return <div className="price-slider" role="group" aria-label="Price per night range">
    <div className="price-slider-values" aria-live="polite">
        <output htmlFor={`${id}-min`}>₹{Number(minValue).toLocaleString('en-IN')}</output>
        <output htmlFor={`${id}-max`}>₹{Number(maxValue).toLocaleString('en-IN')}</output>
    </div>
    <div className="price-slider-track" style={{ '--range-start': `${lower}%`, '--range-end': `${upper}%` }}>
      <input id={`${id}-min`} aria-label="Minimum price per night" type="range" min={min} max={max} step={step} value={minValue} onChange={event => updateMin(event.target.value)} />
      <input id={`${id}-max`} aria-label="Maximum price per night" type="range" min={min} max={max} step={step} value={maxValue} onChange={event => updateMax(event.target.value)} />
    </div>
  </div>;
}
