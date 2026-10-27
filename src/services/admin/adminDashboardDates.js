const RANGE_DAYS = { today: 1, '3d': 3, '7d': 7 };
const IST = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;

function indiaDateParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

function dateString(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function indiaTodayDate(now = new Date()) {
  const { year, month, day } = indiaDateParts(now);
  return dateString(year, month, day);
}

function istMidnightIso(dayOffset, now) {
  const { year, month, day } = indiaDateParts(now);
  const date = new Date(Date.UTC(year, month - 1, day - dayOffset));
  const targetDay = dateString(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  return new Date(`${targetDay}T00:00:00+05:30`).toISOString();
}

export function dashboardDateRange(range, now = new Date()) {
  const days = RANGE_DAYS[range];
  if (!days) return { from: null, to: null };
  return {
    from: istMidnightIso(days - 1, now),
    to: now.toISOString(),
  };
}

function formatDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function dashboardRangeLabel(range, now = new Date()) {
  if (range === 'all') return 'Since the beginning';
  const { year, month, day } = indiaDateParts(now);
  const end = dateString(year, month, day);
  const days = RANGE_DAYS[range] || 1;
  const startDate = new Date(Date.UTC(year, month - 1, day - (days - 1)));
  const start = dateString(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate());
  if (range === 'today') return `${formatDate(end)} ${year}`;
  const endYear = end.slice(0, 4);
  const endLabel = formatDate(end);
  const startLabel = formatDate(start);
  return start.slice(0, 4) === endYear
    ? `${startLabel} - ${endLabel} ${endYear}`
    : `${startLabel} ${start.slice(0, 4)} - ${endLabel} ${endYear}`;
}

export function rangeDateStrings(now = new Date()) {
  const today = indiaTodayDate(now);
  const date = new Date(`${today}T12:00:00Z`);
  const result = {};
  for (const [key, days] of Object.entries(RANGE_DAYS)) {
    const start = new Date(date.getTime() - (days - 1) * DAY_MS);
    result[key] = {
      from: dateString(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()),
      to: today,
    };
  }
  return result;
}
