import { nextDate } from '../components/common/dateOnly.js';

export function expandBookedRanges(ranges) {
  const nights = new Set();
  for (const range of ranges) {
    for (let date = range.check_in; date < range.check_out; date = nextDate(date)) nights.add(date);
  }
  return [...nights].sort();
}

export function firstBookedNightAfter(checkIn, bookedDates) {
  return bookedDates.filter(date => date > checkIn).sort()[0] || '';
}

export function isNightRangeAvailable(checkIn, checkOut, bookedDates) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  return !bookedDates.some(date => date >= checkIn && date < checkOut);
}
