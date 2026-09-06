import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hospitalityPlaces } from '../lib/hospitality.ts';
test('extracts sourced venues and published facts without inventing missing details', () => {
  const places = hospitalityPlaces([
    { type: 'node', id: 1, lat: 46, lon: 7, tags: { name: 'Cafe example', amenity: 'restaurant', cuisine: 'italian;pizza', 'diet:vegan': 'yes', website: 'javascript:alert(1)' } },
    { type: 'way', id: 2, center: { lat: 46.1, lon: 7.1 }, tags: { name: 'Hotel example', tourism: 'hotel', stars: '4', website: 'https://example.com' } },
    { type: 'node', id: 3, tags: { name: 'No coordinates', tourism: 'hotel' } },
  ]);
  assert.equal(places.length, 2);
  assert.equal(places[0].website, undefined);
  assert.equal(places[0].cuisine, 'italian, pizza');
  assert.equal(places[0].dietaryInfo, 'vegan');
  assert.equal(places[1].sourceUrl, 'https://www.openstreetmap.org/way/2');
  assert.equal(places[1].stars, '4');
  assert.equal(places[1].openingHours, undefined);
});
