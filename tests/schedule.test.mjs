import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inclusiveEndDate, dayCapacity, scheduleTimes } from '../lib/schedule.ts';
test('seven-day request preserves Sept 7 through Sept 13', () => {
  assert.equal(inclusiveEndDate('2026-09-07', 7), '2026-09-13');
  assert.throws(() => inclusiveEndDate('2026-02-30', 7));
});
test('spreads limited stops across all seven days', () => {
  let remaining = 9;
  const counts = Array.from({ length: 7 }, (_, i) => { const n = dayCapacity(remaining, 7 - i, 3); remaining -= n; return n; });
  assert.equal(counts.length, 7);
  assert.ok(counts.every((count) => count > 0));
  assert.equal(remaining, 0);
  assert.throws(() => dayCapacity(3, 7, 3), /every requested day/);
});
test('rejects impossible 1000 and 1553 minute transfers instead of formatting 27:40', () => {
  assert.throws(() => scheduleTimes(3, [1000, 1553], 90, 100), /cannot fit/);
  assert.throws(() => scheduleTimes(2, [NaN], 90, 100));
  assert.throws(() => scheduleTimes(6, [10,10,10,10,10], 90, 100));
  assert.deepEqual(scheduleTimes(2, [20], 90, 100)[1], { startTime: '13:30', endTime: '15:00', travelMinutesFromPrevious: 20 });
});
