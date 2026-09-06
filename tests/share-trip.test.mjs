import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeTrip, decodeTrip } from '../lib/share-trip.ts';
test('share snapshot preserves itinerary and Unicode without regenerating it', async () => {
  const snapshot = { version: 1, plan: { destination: 'Zürich', itinerary: [{ name: 'Café', startTime: '09:30' }] } };
  const encoded = await encodeTrip(snapshot);
  assert.match(encoded, /^[\w-]+$/);
  assert.deepEqual(await decodeTrip(encoded), snapshot);
  await assert.rejects(decodeTrip('invalid'));
  await assert.rejects(decodeTrip('a'.repeat(80001)), /too large/);
});
