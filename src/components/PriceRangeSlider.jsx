import { useId } from 'react';

const MIN = 1000;
const MAX = 10000;
const STEP = 500;

export default function PriceRangeSlider({ value, onChange }) {
  const id = useId();
  const [minValue, maxValue] = value;
  const span = MAX - MIN;
  const lower = ((minValue - MIN) / span) * 100;
  const upper = ((maxValue - MIN) / span) * 100;
  const updateMin = next => onChange([Math.min(Number(next), maxValue - STEP), maxValue]);
  const updateMax = next => onChange([minValue, Math.max(Number(next), minValue + STEP)]);

  return <div className="price-slider" role="group" aria-label="Price per night range">
    <div className="price-slider-values" aria-live="polite">
      <output htmlFor={`${id}-min`}>₹{minValue.toLocaleString('en-IN')}</output>
      <output htmlFor={`${id}-max`}>₹{maxValue.toLocaleString('en-IN')}</output>
    </div>
    <div className="price-slider-track" style={{ '--range-start': `${lower}%`, '--range-end': `${upper}%` }}>
      <input id={`${id}-min`} aria-label="Minimum price per night" type="range" min={MIN} max={MAX} step={STEP} value={minValue} onChange={event => updateMin(event.target.value)} />
      <input id={`${id}-max`} aria-label="Maximum price per night" type="range" min={MIN} max={MAX} step={STEP} value={maxValue} onChange={event => updateMax(event.target.value)} />
    </div>
  </div>;
}
