import { test } from 'node:test';
import assert from 'node:assert/strict';
import { briefReady } from '../lib/brief-readiness.ts';
const brief = { origin: 'Islamabad', destination: 'Baku', startDate: '2026-09-07', endDate: '2026-09-11', travelers: 1 };
test('complete brief starts automatically without optional form fields', () => {
  assert.equal(briefReady(brief, []), true);
  assert.equal(briefReady(brief, ['Would you like me to emphasize food or nature?']), true);
});
test('missing required details and invalid dates prevent automatic planning', () => {
  assert.equal(briefReady({ ...brief, origin: '' }, []), false);
  for (const patch of [{ destination: '' }, { travelers: 0 }, { startDate: null }, { endDate: '2026-09-20' }, { startDate: '2026-02-30' }, { endDate: '2026-09-01' }]) {
    assert.equal(briefReady({ ...brief, ...patch }, []), false);
  }
});
