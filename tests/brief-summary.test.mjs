import { test } from 'node:test';
import assert from 'node:assert/strict';
import { briefSummary } from '../lib/brief-summary.ts';
test('Baku summary uses accumulated details instead of echoing the latest answer', () => {
  const summary = briefSummary({ destination: 'Baku', origin: 'Rawalpindi, Pakistan', durationDays: 5, startDate: '2026-09-07', endDate: '2026-09-11', budget: 1500, currency: 'USD', travelers: 0, interests: ['local food'] });
  assert.match(summary, /Baku from Rawalpindi/);
  assert.match(summary, /5 days/);
  assert.match(summary, /USD 1500/);
  assert.doesNotMatch(summary, /solo|1 traveler/);
});
