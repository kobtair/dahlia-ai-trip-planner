import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practicalDay } from '../lib/practical-day.ts';
const stops = ['food stop', 'nature stop', 'viewpoint'];
const walk = { durationMinutes: 180, legs: [90,90], source: 'OSRM foot route', status: 'live' };
test('Baku-style scattered stops recover with verified road transfers and buffers', async () => {
  const result = await practicalDay(stops, walk, async () => ({ durationMinutes: 30, legs: [15,15], source: 'OSRM road route estimate', status: 'live' }), 90, 100, 570);
  assert.equal(result.places.length, 3);
  assert.deepEqual(result.route.legs, [25,25]);
  assert.equal(result.route.durationMinutes, 50);
  assert.equal(result.route.status, 'estimated');
  assert.ok(result.times.every((visit) => visit.endTime <= '18:00'));
  assert.match(result.note, /car\/taxi/);
});
test('practical walks do not trigger a road lookup', async () => {
  const result = await practicalDay(stops, { ...walk, durationMinutes: 20, legs: [10,10] }, async () => { throw new Error('Should not be called'); }, 90, 100, 570);
  assert.equal(result.note, '');
  assert.equal(result.route.source, 'OSRM foot route');
});
test('unavailable or still-impossible road routes cannot bypass daily limits', async () => {
  await assert.rejects(practicalDay(stops, walk, async () => { throw new Error('Unavailable'); }, 90, 100, 570), /Unavailable/);
  await assert.rejects(practicalDay(stops, walk, async () => ({ ...walk, legs: [400,400] }), 90, 100, 570), /cannot fit/);
});
