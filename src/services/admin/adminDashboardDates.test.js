import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardDateRange, dashboardRangeLabel, indiaTodayDate, rangeDateStrings } from './adminDashboardDates.js';

test('dashboard date ranges follow India midnight even when UTC is on the previous date', () => {
  const now = new Date('2026-10-27T20:00:00.000Z');
  assert.equal(indiaTodayDate(now), '2026-10-28');
  assert.equal(dashboardDateRange('today', now).from, '2026-10-27T18:30:00.000Z');
  assert.equal(dashboardDateRange('3d', now).from, '2026-10-25T18:30:00.000Z');
  assert.equal(dashboardDateRange('7d', now).from, '2026-10-21T18:30:00.000Z');
  assert.equal(dashboardDateRange('today', now).to, now.toISOString());
  assert.equal(dashboardRangeLabel('today', now), '28 Oct 2026');
});

test('comparison ranges are nested and all time has no date bounds', () => {
  const ranges = rangeDateStrings(new Date('2026-10-27T20:00:00.000Z'));
  assert.deepEqual(ranges.today, { from: '2026-10-28', to: '2026-10-28' });
  assert.ok(ranges['3d'].from <= ranges.today.from);
  assert.ok(ranges['7d'].from <= ranges['3d'].from);
  assert.deepEqual(dashboardDateRange('all', new Date('2026-10-27T20:00:00.000Z')), { from: null, to: null });
  assert.equal(dashboardRangeLabel('all'), 'Since the beginning');

  const createdDates = Array.from({ length: 8 }, (_, index) => `2026-10-${String(21 + index).padStart(2, '0')}`);
  const count = (range) => createdDates.filter(date => date >= ranges[range].from && date <= ranges[range].to).length;
  assert.ok(count('today') <= count('3d'));
  assert.ok(count('3d') <= count('7d'));
  assert.ok(count('7d') <= createdDates.length);
});
