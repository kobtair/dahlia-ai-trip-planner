import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeSelectionSchema, validatePlaceSelection, selectVerifiedPlaces } from '../lib/place-selection.ts';

const ids = ['wiki-123', 'osm-node-456'];
const good = { places: [{ id: ids[0], reason: 'Matches the history brief.' }], limitations: [] };

test('schema restricts selection to exactly the supplied IDs', () => {
  assert.deepEqual(placeSelectionSchema(ids).properties.places.items.properties.id.enum, ids);
  assert.throws(() => placeSelectionSchema([]), /No sourced places/);
});
test('validation rejects invented IDs, duplicate IDs and malformed entries', () => {
  assert.deepEqual(validatePlaceSelection(good, ids), good);
  for (const places of [[{ id: 'invented', reason: 'Nice' }], [null], [good.places[0], good.places[0]], [{ id: ids[0], reason: '' }]]) {
    assert.equal(validatePlaceSelection({ places, limitations: [] }, ids), null);
  }
  assert.equal(validatePlaceSelection(null, ids), null);
});
test('first-attempt invalid selection recovers automatically with verified IDs', async () => {
  const attempts = [];
  const result = await selectVerifiedPlaces(ids, async (_schema, retry) => {
    attempts.push(retry);
    return retry ? good : { places: [{ id: 'invented', reason: 'Nice' }], limitations: [] };
  });
  assert.deepEqual(attempts, [false, true]);
  assert.deepEqual(result, good);
});
test('invalid output stops after two attempts; provider errors are not retried', async () => {
  let attempts = 0;
  await assert.rejects(selectVerifiedPlaces(ids, async () => { attempts++; return null; }), /No unverified places/);
  assert.equal(attempts, 2);
  attempts = 0;
  await assert.rejects(selectVerifiedPlaces(ids, async () => { attempts++; throw new Error('billing'); }), /billing/);
  assert.equal(attempts, 1);
});

test('duplicate and unknown entries do not discard otherwise sufficient verified places', async () => {
  let calls = 0;
  const result = await selectVerifiedPlaces(ids, async () => {
    calls++;
    return { places: [good.places[0], good.places[0], { id: 'invented', reason: 'No source' }, { id: ids[1], reason: 'Another sourced stop' }], limitations: [] };
  }, 2);
  assert.deepEqual(result.places.map((place) => place.id), ids);
  assert.equal(calls, 1);
});

test('retry keeps verified selections and requests enough distinct places', async () => {
  let calls = 0;
  const result = await selectVerifiedPlaces(ids, async (_schema, retry, feedback) => {
    calls++;
    if (!retry) return good;
    assert.match(feedback, /wiki-123/);
    return { places: [{ id: ids[1], reason: 'Verified second stop' }], limitations: [] };
  }, 2);
  assert.equal(calls, 2);
  assert.equal(result.places.length, 2);
});
