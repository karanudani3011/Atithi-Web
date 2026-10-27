import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarMonth, expandBookedRanges, firstBookedNightAfter, isNightRangeAvailable, shiftCalendarMonth } from './availabilityDates.js';

test('27 to 28 October occupies only the night of the 27th', () => {
  const booked = expandBookedRanges([{ check_in: '2026-10-27', check_out: '2026-10-28' }]);
  assert.deepEqual(booked, ['2026-10-27']);
  assert.equal(isNightRangeAvailable('2026-10-28', '2026-10-29', booked), true);
  assert.equal(isNightRangeAvailable('2026-10-26', '2026-10-28', booked), false);
});

test('28 to 30 October occupies the 28th and 29th; 30th is an allowed checkout boundary', () => {
  const booked = expandBookedRanges([{ check_in: '2026-10-28', check_out: '2026-10-30' }]);
  assert.deepEqual(booked, ['2026-10-28', '2026-10-29']);
  assert.equal(firstBookedNightAfter('2026-10-27', booked), '2026-10-28');
  assert.equal(isNightRangeAvailable('2026-10-27', '2026-10-28', booked), true);
  assert.equal(isNightRangeAvailable('2026-10-27', '2026-10-29', booked), false);
  assert.equal(isNightRangeAvailable('2026-10-30', '2026-10-31', booked), true);
});

test('calendar month navigation crosses December and January in either direction', () => {
  const december = calendarMonth(new Date(2026, 11, 15, 12));
  const january = shiftCalendarMonth(december, 1);
  assert.equal(january.getFullYear(), 2027);
  assert.equal(january.getMonth(), 0);
  const back = shiftCalendarMonth(january, -1);
  assert.equal(back.getFullYear(), 2026);
  assert.equal(back.getMonth(), 11);
});

test('pending ranges are represented as occupied ranges; cancelled ranges are not returned by the RPC', () => {
  const pendingRanges = [{ check_in: '2026-10-27', check_out: '2026-10-28' }];
  const cancelledRanges = [];
  assert.deepEqual(expandBookedRanges(pendingRanges), ['2026-10-27']);
  assert.deepEqual(expandBookedRanges(cancelledRanges), []);
});
